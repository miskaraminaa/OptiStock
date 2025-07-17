import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
    const [importedFiles, setImportedFiles] = useState([]);
    const [fileType, setFileType] = useState('LE');
    const [uploadStatus, setUploadStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Définir les types de fichiers avec des libellés descriptifs
    const fileTypes = [
        { value: 'LE', label: 'LE - Statut Livraisons Entrantes' },
        { value: 'LET', label: 'LET - Tâches Livraisons Entrantes' },
        { value: 'LS', label: 'LS - Statut Livraisons Sortantes' },
        { value: 'LST', label: 'LST - Tâches Livraisons Sortantes' },
        { value: 'MB51', label: 'MB51 - Mouvements SAP' },
        { value: 'STOCK_EWM', label: 'STOCK_EWM' },
        { value: 'STOCK_IAM', label: 'STOCK_IAM' }
    ];

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Récupérer les fichiers importés depuis le backend
    const fetchImportedFiles = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/uploads/files`);
            console.log('Réponse fichiers importés:', response.data);
            setImportedFiles(response.data.files);
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers importés:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            setUploadStatus('Échec du chargement des fichiers importés.');
        }
    }, []);

    // Charger les fichiers importés au montage
    useEffect(() => {
        const loadFiles = async () => {
            await fetchImportedFiles();
            setIsLoading(false);
        };
        loadFiles();
    }, [fetchImportedFiles]);

    const onDrop = useCallback(
        async (acceptedFiles) => {
            setUploadStatus('Téléversement en cours...');

            const uploadPromises = acceptedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', fileType);

                try {
                    const response = await axios.post(`${API_URL}/uploads`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                    });
                    console.log('Réponse téléversement:', response.data);
                    return { status: 'success', message: response.data.message, fileName: file.name };
                } catch (error) {
                    console.error('Erreur téléversement:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                    return {
                        status: 'failed',
                        error: error.response?.data?.message || 'Échec du téléversement',
                        fileName: file.name
                    };
                }
            });

            try {
                const results = await Promise.all(uploadPromises);
                await fetchImportedFiles();

                const allSuccessful = results.every((result) => result.status === 'success');
                const allFailed = results.every((result) => result.status === 'failed');
                if (allSuccessful) {
                    setUploadStatus('Téléversement réussi pour tous les fichiers !');
                } else if (allFailed) {
                    setUploadStatus('Échec du téléversement de tous les fichiers !');
                } else {
                    setUploadStatus('Certains fichiers ont été téléversés avec succès, d\'autres ont échoué.');
                }
                const failedUploads = results.filter(result => result.status === 'failed');
                if (failedUploads.length > 0) {
                    console.log('Fichiers échoués:', failedUploads);
                    setUploadStatus(prev => prev + '\nErreurs : ' + failedUploads.map(f => `${f.fileName}: ${f.error}`).join(', '));
                }
            } catch (error) {
                setUploadStatus(`Erreur lors du traitement des fichiers : ${error.message}`);
            }
        },
        [fileType, fetchImportedFiles]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
    });

    const groupedImportedFiles = importedFiles.reduce((acc, file) => {
        acc[file.type] = acc[file.type] || [];
        acc[file.type].push(file);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-xl text-gray-600">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">Téléversement de Fichiers OptiStock</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Sélectionner le Type de Fichier
                    </label>
                    <select
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {fileTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
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
                            ? 'Déposez les fichiers Excel ici...'
                            : 'Glissez et déposez les fichiers Excel ici, ou cliquez pour sélectionner'}
                    </p>
                    <p className="text-sm text-gray-500">(fichiers .xlsx, .xls uniquement)</p>
                </div>

                {uploadStatus && (
                    <p
                        className={`mt-4 text-center ${uploadStatus.includes('réussi')
                            ? 'text-green-600'
                            : uploadStatus.includes('Échec') || uploadStatus.includes('Erreur')
                                ? 'text-red-600'
                                : 'text-yellow-600'}`}
                    >
                        {uploadStatus}
                    </p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Fichiers Importés</h2>
                {Object.keys(groupedImportedFiles).length === 0 ? (
                    <p className="text-gray-500 text-center">Aucun fichier importé pour le moment.</p>
                ) : (
                    Object.keys(groupedImportedFiles).map((type) => (
                        <div key={type} className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                Type : {fileTypes.find(t => t.value === type)?.label || type}
                            </h3>
                            <ul className="divide-y divide-gray-200">
                                {groupedImportedFiles[type].map((file) => (
                                    <li key={file.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-gray-700">{file.fichier_name}</span>
                                            <span
                                                className={`ml-2 text-sm ${file.status === 'imported'
                                                    ? 'text-green-600'
                                                    : file.status === 'partial'
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                ({file.status === 'imported' ? 'Importé' : file.status === 'partial' ? 'Partiel' : 'Échoué'})
                                            </span>
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            {new Date(file.import_date).toLocaleString('fr-FR')}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileUpload;