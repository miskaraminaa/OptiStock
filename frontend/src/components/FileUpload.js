import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
    const [files, setFiles] = useState([]);
    const [fileType, setFileType] = useState('LE');
    const [uploadStatus, setUploadStatus] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fileTypes = ['LE', 'LET', 'LS', 'LST', 'MB51', 'MOUVEMENT', 'STOCK_EMW', 'ETAT_DE_STOCK'];
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            console.log('Token on mount:', token);
            if (!token) {
                setUploadStatus('No session found. Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/verify-token`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Verify token response:', response.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Token verification error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                setUploadStatus('Invalid session. Redirecting to login...');
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
                setIsLoading(false);
            }
        };
        verifyToken();
    }, [navigate]);

    const onDrop = useCallback(
        async (acceptedFiles) => {
            const token = localStorage.getItem('token');
            console.log('Token on upload:', token);
            if (!token) {
                setUploadStatus('Please log in to upload files.');
                navigate('/login');
                return;
            }

            const existingFiles = files.map((f) => f.name);
            const newFiles = acceptedFiles
                .filter((file) => !existingFiles.includes(file.name))
                .map((file) => ({
                    name: file.name,
                    type: fileType,
                    size: file.size,
                    date: new Date().toLocaleString(),
                    fileObj: file,
                    data: null,
                }));

            if (newFiles.length === 0) {
                setUploadStatus('All selected files are already imported!');
                return;
            }

            setUploadStatus('Uploading...');

            // Read files locally for preview
            const readPromises = newFiles.map(
                (fileEntry) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const data = new Uint8Array(e.target.result);
                                const workbook = XLSX.read(data, { type: 'array' });
                                const sheetName = workbook.SheetNames[0];
                                const worksheet = workbook.Sheets[sheetName];
                                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                fileEntry.data = jsonData;
                                resolve();
                            } catch (error) {
                                reject(new Error(`Failed to read file ${fileEntry.name}: ${error.message}`));
                            }
                        };
                        reader.onerror = () => reject(new Error(`Error reading file ${fileEntry.name}`));
                        reader.readAsArrayBuffer(fileEntry.fileObj);
                    })
            );

            try {
                await Promise.all(readPromises);

                // Send each file to the backend
                const uploadPromises = newFiles.map(async (fileEntry) => {
                    const formData = new FormData();
                    formData.append('file', fileEntry.fileObj);
                    formData.append('type', fileEntry.type);

                    try {
                        const response = await axios.post(`${API_URL}/uploads`, formData, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            },
                        });
                        console.log('Upload response:', response.data);
                        return {
                            ...fileEntry,
                            status: 'success',
                            backendData: response.data,
                        };
                    } catch (error) {
                        console.error('Upload error:', {
                            message: error.message,
                            status: error.response?.status,
                            data: error.response?.data
                        });
                        if (error.response?.status === 401) {
                            setUploadStatus('Session expired. Redirecting to login...');
                            localStorage.removeItem('token');
                            navigate('/login');
                            return {
                                ...fileEntry,
                                status: 'failed',
                                error: 'Unauthorized: Please log in again',
                            };
                        }
                        return {
                            ...fileEntry,
                            status: 'failed',
                            error: error.response?.data?.message || 'Upload failed',
                        };
                    }
                });

                const uploadedFiles = await Promise.all(uploadPromises);

                // Update state with uploaded files
                setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);

                // Set upload status based on results
                const allSuccessful = uploadedFiles.every((file) => file.status === 'success');
                const allFailed = uploadedFiles.every((file) => file.status === 'failed');
                if (allSuccessful) {
                    setUploadStatus('Upload successful!');
                } else if (allFailed) {
                    setUploadStatus('Upload failed for all files!');
                } else {
                    setUploadStatus('Some files uploaded successfully, others failed.');
                }
            } catch (error) {
                setUploadStatus(`Error processing files: ${error.message}`);
            }
        },
        [fileType, files, navigate]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
    });

    const groupedFiles = files.reduce((acc, file) => {
        acc[file.type] = acc[file.type] || [];
        acc[file.type].push(file);
        return acc;
    }, {});

    const openDialog = (file) => {
        setSelectedFile(file);
        setFileContent(file.data || []);
    };

    const closeDialog = () => {
        setSelectedFile(null);
        setFileContent([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-xl text-gray-600">Verifying session...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">OptiStock File Upload</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Select File Type</label>
                    <select
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {fileTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                >
                    <input {...getInputProps()} />
                    <p className="text-gray-600">
                        {isDragActive
                            ? 'Drop the Excel files here...'
                            : 'Drag & drop Excel files here, or click to select'}
                    </p>
                    <p className="text-sm text-gray-500">(.xlsx, .xls files only)</p>
                </div>

                {uploadStatus && (
                    <p
                        className={`mt-4 text-center ${uploadStatus.includes('successful')
                            ? 'text-green-600'
                            : uploadStatus.includes('failed') || uploadStatus.includes('Error')
                                ? 'text-red-600'
                                : 'text-yellow-600'}`}
                    >
                        {uploadStatus}
                    </p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                {Object.keys(groupedFiles).length === 0 ? (
                    <p className="text-gray-500 text-center">No files uploaded yet.</p>
                ) : (
                    Object.keys(groupedFiles).map((type) => (
                        <div key={type} className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Type: {type}</h3>
                            <ul className="divide-y divide-gray-200">
                                {groupedFiles[type].map((file, index) => (
                                    <li key={index} className="py-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-gray-700">{file.name}</span>
                                            {file.status && (
                                                <span
                                                    className={`ml-2 text-sm ${file.status === 'success' ? 'text-green-600' : 'text-red-600'}`}
                                                >
                                                    ({file.status === 'success' ? 'Uploaded' : file.error})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-500 text-sm">
                                                {(file.size / 1024).toFixed(2)} KB | {file.date}
                                            </span>
                                            <button
                                                onClick={() => openDialog(file)}
                                                className="ml-4 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>

            {selectedFile && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
                    onClick={closeDialog}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">File Content: {selectedFile.name}</h3>
                        {fileContent.length > 0 && fileContent[0]?.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        {fileContent[0].map((header, index) => (
                                            <th key={index} className="border p-2 bg-gray-200">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {fileContent.slice(1).map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                                <td key={cellIndex} className="border p-2">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500">No valid content to display.</p>
                        )}
                        {selectedFile.status === 'success' && selectedFile.backendData && (
                            <div className="mt-4">
                                <h4 className="text-md font-medium">Backend Response:</h4>
                                <p>Successful Rows: {selectedFile.backendData.summary.successfulRows}</p>
                                <p>Failed Rows: {selectedFile.backendData.summary.failedRows}</p>
                                {selectedFile.backendData.data.failureDetails.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium">Failure Details:</h5>
                                        <ul>
                                            {selectedFile.backendData.data.failureDetails.map((fail, idx) => (
                                                <li key={idx} className="text-sm text-red-600">
                                                    Row {fail.rowIndex}: {fail.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={closeDialog}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;