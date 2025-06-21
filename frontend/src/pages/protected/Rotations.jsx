import React, { useState, useEffect, useRef } from "react";
import TitleCard from "../../components/Cards/TitleCard";
import * as XLSX from "xlsx";

const Rotations = () => {
    const [movementFile, setMovementFile] = useState(null);
    const [stockFile, setStockFile] = useState(null);
    const [message, setMessage] = useState("");
    const [rotations, setRotations] = useState({
        plant: [],
        slc: [],
        wj01: [],
    });
    const tableRef = useRef(null);

    // Handle file selection
    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (file) {
            if (fileType === "movement") setMovementFile(file);
            else if (fileType === "stock") setStockFile(file);
            setMessage(`${file.name} uploaded successfully.`);
        }
    };

    // Placeholder for rotation calculation
    const calculateRotations = () => {
        if (!movementFile || !stockFile) {
            setMessage("Please upload both movement and stock files.");
            return;
        }

        // Simulate reading and processing files (replace with actual logic)
        const reader1 = new FileReader();
        const reader2 = new FileReader();

        reader1.onload = (e) => {
            const movementData = new Uint8Array(e.target.result);
            const workbook1 = XLSX.read(movementData, { type: "array" });
            const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
            const movementJson = XLSX.utils.sheet_to_json(sheet1);

            reader2.onload = (e) => {
                const stockData = new Uint8Array(e.target.result);
                const workbook2 = XLSX.read(stockData, { type: "array" });
                const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
                const stockJson = XLSX.utils.sheet_to_json(sheet2);

                // Placeholder rotation logic (customize based on your data structure)
                const plantRotations = movementJson
                    .filter((m) => m.Plant)
                    .map((m) => ({
                        id: m.ID || "N/A",
                        plant: m.Plant,
                        rotation: Math.random() * 100, // Replace with actual calculation
                    }));
                const slcRotations = movementJson
                    .filter((m) => m.SLC)
                    .map((m) => ({
                        id: m.ID || "N/A",
                        slc: m.SLC,
                        rotation: Math.random() * 100, // Replace with actual calculation
                    }));
                const wj01Rotations = movementJson
                    .filter((m) => m.WJ01)
                    .map((m) => ({
                        id: m.ID || "N/A",
                        wj01: m.WJ01,
                        rotation: Math.random() * 100, // Replace with actual calculation
                    }));

                setRotations({ plant: plantRotations, slc: slcRotations, wj01: wj01Rotations });
                setMessage("Rotations calculated successfully.");
            };
            reader2.readAsArrayBuffer(stockFile);
        };
        reader1.readAsArrayBuffer(movementFile);
    };

    // Handle Excel export
    const handleExportExcel = (type) => {
        const data =
            type === "plant"
                ? rotations.plant
                : type === "slc"
                    ? rotations.slc
                    : rotations.wj01;
        if (data.length === 0) {
            setMessage("No data to export.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Rotation_${type}`);
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rotation_${type}_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle print
    const handlePrint = (type) => {
        const printContent = tableRef.current;
        if (!printContent) {
            console.error("Table reference is null. Ensure the table is rendered.");
            return;
        }

        const printWindow = window.open("", "", "height=600,width=800");
        if (printWindow) {
            printWindow.document.write("<html><head><title>Print</title>");
            printWindow.document.write(
                "<style>body { margin: 0; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>"
            );
            printWindow.document.write("</head><body>");
            printWindow.document.write(printContent.outerHTML);
            printWindow.document.write("</body></html>");
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } else {
            console.error("Failed to open print window. Check browser popup settings.");
        }
    };

    return (
        <TitleCard title="Calcul des Rotations">
            <div className="p-6 bg-white rounded-lg shadow-lg">
                {/* File Upload Section */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Sélection des Fichiers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fichier Mouvement
                            </label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileChange(e, "movement")}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fichier État de Stock
                            </label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => handleFileChange(e, "stock")}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                    <button
                        onClick={calculateRotations}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Calculer les Rotations
                    </button>
                </div>

                {message && <p className="mt-4 text-sm text-center text-red-600">{message}</p>}

                {/* Display and Filter Results */}
                <div className="mt-8">
                    {["plant", "slc", "wj01"].map((type) => (
                        <div key={type} className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">
                                Rotation par {type === "plant" ? "Plant" : type === "slc" ? "SLC" : "WJ01"}
                            </h2>
                            <div className="mb-4 flex space-x-4">
                                <button
                                    onClick={() => handleExportExcel(type)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Exporter en Excel
                                </button>
                                <button
                                    onClick={() => handlePrint(type)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Imprimer
                                </button>
                            </div>
                            {rotations[type].length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table ref={tableRef} className="min-w-full bg-white border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                                                    ID
                                                </th>
                                                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                                                    {type === "plant" ? "Plant" : type === "slc" ? "SLC" : "WJ01"}
                                                </th>
                                                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                                                    Rotation
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rotations[type].map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                                                        {item.id}
                                                    </td>
                                                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                                                        {item[type]}
                                                    </td>
                                                    <td className="py-2 px-4 border-b text-sm text-gray-900">
                                                        {item.rotation.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">Aucune rotation calculée.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </TitleCard>
    );
};

export default Rotations;