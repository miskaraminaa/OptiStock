import React, { useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_DATA = [
    { id: "10000010", totalExits: 2.60, averageStock: 10.50, turnoverRate: 0.25 },
    { id: "10000114", totalExits: 830.70, averageStock: 415.35, turnoverRate: 2.00 },
    { id: "10000220", totalExits: 150.00, averageStock: 300.00, turnoverRate: 0.50 },
    { id: "10000330", totalExits: 500.00, averageStock: 200.00, turnoverRate: 2.50 },
];

const Rotations = ({ data = INITIAL_DATA }) => {
    const [tableData, setTableData] = useState(data);
    const [filter, setFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [showHighTurnoverOnly, setShowHighTurnoverOnly] = useState(false);

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedData = [...tableData].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setTableData(sortedData);
    };

    const filteredData = tableData.filter((item) =>
        item.id.includes(filter) &&
        (!showHighTurnoverOnly || item.turnoverRate > 1)
    );

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Rotation des Stocks par Article (2025)
                </h2>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Filtrer par ID d'article..."
                        value={filter}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filtrer les articles par ID"
                    />
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={showHighTurnoverOnly}
                            onChange={() => setShowHighTurnoverOnly(!showHighTurnoverOnly)}
                            className="mr-2"
                            aria-label="Afficher uniquement les articles avec taux de rotation supérieur à 1"
                        />
                        Afficher uniquement les taux &gt; 1
                    </label>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("id")}
                                    role="button"
                                    aria-sort={sortConfig.key === "id" ? sortConfig.direction : "none"}
                                >
                                    Article {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("totalExits")}
                                    role="button"
                                    aria-sort={sortConfig.key === "totalExits" ? sortConfig.direction : "none"}
                                >
                                    Total Sorties {sortConfig.key === "totalExits" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("averageStock")}
                                    role="button"
                                    aria-sort={sortConfig.key === "averageStock" ? sortConfig.direction : "none"}
                                >
                                    Stock Moyen {sortConfig.key === "averageStock" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("turnoverRate")}
                                    role="button"
                                    aria-sort={sortConfig.key === "turnoverRate" ? sortConfig.direction : "none"}
                                >
                                    Taux de Rotation {sortConfig.key === "turnoverRate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`border-b ${item.turnoverRate > 1 ? "bg-red-100 text-red-700 font-semibold" : "even:bg-gray-50"}`}
                                >
                                    <td className="p-3">{item.id}</td>
                                    <td className="p-3">{item.totalExits.toFixed(2)}</td>
                                    <td className="p-3">{item.averageStock.toFixed(2)}</td>
                                    <td className="p-3 flex items-center">
                                        {item.turnoverRate.toFixed(2)}
                                        {item.turnoverRate > 1 && (
                                            <span className="ml-2 text-red-500" aria-label="Alerte : taux de rotation élevé">⚠️</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                    <strong>Remarque :</strong> Les articles avec un taux de rotation &gt; 1 sont en surbrillance avec une alerte.
                </p>
            </div>
        </div>
    );
};

Rotations.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            totalExits: PropTypes.number.isRequired,
            averageStock: PropTypes.number.isRequired,
            turnoverRate: PropTypes.number.isRequired,
        })
    ),
};

export default Rotations;