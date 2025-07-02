import React, { useState, useEffect } from 'react';

const Rotations = () => {
    const [tableData, setTableData] = useState([]);
    const [filter, setFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [turnoverFilter, setTurnoverFilter] = useState('all'); // 'all', 'high' (> 1), 'low' (< 1)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2025'); // Default year
    const [yearError, setYearError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedYear) {
                setYearError('Veuillez sélectionner une année.');
                setLoading(false);
                return;
            }
            setYearError(null);
            try {
                const response = await fetch(`http://localhost:5000/rotation/turnover?years=${selectedYear}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch turnover data');
                }
                const data = await response.json();
                const validatedData = data.map(item => ({
                    id: item.id || 'N/A',
                    totalExits: Number(item.totalExits) || 0,
                    averageStock: Number(item.averageStock) || 0,
                    turnoverRate: Number(item.turnoverRate) || 0,
                }));
                setTableData(validatedData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedYear]);

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1); // Reset to first page on filter change
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

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setCurrentPage(1); // Reset to first page on year change
    };

    const handleTurnoverFilterChange = (e) => {
        setTurnoverFilter(e.target.value);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

    const filteredData = tableData.filter((item) =>
        item.id.includes(filter) &&
        (turnoverFilter === 'all' ||
            (turnoverFilter === 'high' && item.turnoverRate > 1) ||
            (turnoverFilter === 'low' && item.turnoverRate < 1))
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return <div className="container mx-auto p-6">Chargement...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-6 text-red-500">Erreur : {error}</div>;
    }

    if (yearError) {
        return <div className="container mx-auto p-6 text-red-500">{yearError}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Rotation des Stocks par Article
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
                    <select
                        value={turnoverFilter}
                        onChange={handleTurnoverFilterChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filtrer par taux de rotation"
                    >
                        <option value="all">Tous les taux</option>
                        <option value="high">Taux &gt; 1</option>
                        <option value="low">Taux &lt; 1</option>
                    </select>
                    <select
                        value={selectedYear}
                        onChange={handleYearChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Sélectionner l'année"
                    >
                        <option value="">Sélectionner une année</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
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
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-3 text-center text-gray-500">
                                        Aucun article trouvé.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b ${item.turnoverRate > 1 ? "bg-yellow-100 text-yellow-700 font-semibold" : "even:bg-gray-50"}`}
                                    >
                                        <td className="p-3">{item.id}</td>
                                        <td className="p-3">{isNaN(item.totalExits) ? '0.00' : item.totalExits.toFixed(2)}</td>
                                        <td className="p-3">{isNaN(item.averageStock) ? '0.00' : item.averageStock.toFixed(2)}</td>
                                        <td className="p-3 flex items-center">
                                            {isNaN(item.turnoverRate) ? '0.00' : item.turnoverRate.toFixed(2)}
                                            {item.turnoverRate > 1 && (
                                                <span className="ml-2 text-yellow-600" aria-label="Alerte : taux de rotation élevé">⚠️</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
                    >
                        Précédent
                    </button>
                    <span>
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
                    >
                        Suivant
                    </button>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                    <strong>Remarque :</strong> Les articles avec un taux de rotation supérieur à 1 sont en surbrillance avec une alerte.
                </p>
            </div>
        </div>
    );
};

export default Rotations;