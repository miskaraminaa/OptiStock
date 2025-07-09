import React, { useState, useEffect } from 'react';

const Rotations = () => {
    const [tableData, setTableData] = useState([]);
    const [filter, setFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [turnoverFilter, setTurnoverFilter] = useState('all');
    const [stockoutFilter, setStockoutFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2025');
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
                const response = await fetch(`http://localhost:5000/rotation/kpi?years=${selectedYear}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch KPI data');
                }
                const data = await response.json();
                const validatedData = data.map(item => ({
                    id: item.id || 'N/A',
                    totalExits: item.totalExits === 'Aucune Sortie' ? 0 : Number(item.totalExits) || 0,
                    averageStock: item.averageStock === 'Aucune Donnée de Stock' ? 0 : Number(item.averageStock) || 0,
                    turnoverRate: item.turnoverRate === 'Non Calculé' || item.turnoverRate === 'Aucune Sortie' ? 0 : Number(item.turnoverRate) || 0,
                    stockoutTasks: item.stockoutTasks === 'Aucune Tâche de Prélèvement' ? 0 : Number(item.stockoutTasks) || 0,
                    totalPickupTasks: item.totalPickupTasks === 'Aucune Tâche de Prélèvement' ? 0 : Number(item.totalPickupTasks) || 0,
                    stockoutRate: item.stockoutRate === 'Non Calculé' || item.stockoutRate === 'Aucune Rupture de Stock' ? 0 : Number(item.stockoutRate) || 0,
                }));

                // Tri initial : articles avec turnoverRate et stockoutRate non nuls en premier
                const sortedData = validatedData.sort((a, b) => {
                    const aHasValues = (a.turnoverRate > 0 && a.stockoutRate > 0) ? 1 : 0;
                    const bHasValues = (b.turnoverRate > 0 && b.stockoutRate > 0) ? 1 : 0;
                    if (aHasValues !== bHasValues) {
                        return bHasValues - aHasValues; // Articles avec turnoverRate et stockoutRate non nuls en premier
                    }
                    // Si les deux ont des valeurs non nulles ou nulles, trier par turnoverRate descendant
                    return b.turnoverRate - a.turnoverRate;
                });

                setTableData(sortedData);
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
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedData = [...tableData].sort((a, b) => {
            const aValue = a[key] === 'Aucune Donnée' ? 0 : a[key];
            const bValue = b[key] === 'Aucune Donnée' ? 0 : b[key];
            if (aValue < bValue) return direction === "asc" ? -1 : 1;
            if (aValue > bValue) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setTableData(sortedData);
    };

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setCurrentPage(1);
    };

    const handleTurnoverFilterChange = (e) => {
        setTurnoverFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleStockoutFilterChange = (e) => {
        setStockoutFilter(e.target.value);
        setCurrentPage(1);
    };

    const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

    const filteredData = tableData.filter((item) =>
        item.id.includes(filter) &&
        (turnoverFilter === 'all' ||
            (turnoverFilter === 'high' && item.turnoverRate > 1) ||
            (turnoverFilter === 'low' && item.turnoverRate < 1)) &&
        (stockoutFilter === 'all' ||
            (stockoutFilter === 'high' && item.stockoutRate > 10) ||
            (stockoutFilter === 'low' && item.stockoutRate < 10))
    );

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
                    KPI des Stocks par Article
                </h2>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Filtrer par ID d'article..."
                        value={filter}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filtrer les articles par ID"
                    />
                    <select
                        value={turnoverFilter}
                        onChange={handleTurnoverFilterChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filtrer par taux de rotation"
                    >
                        <option value="all">Tous les taux de rotation</option>
                        <option value="high">Taux de rotation &gt; 1</option>
                        <option value="low">Taux de rotation &lt; 1</option>
                    </select>
                    <select
                        value={stockoutFilter}
                        onChange={handleStockoutFilterChange}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filtrer par taux de rupture"
                    >
                        <option value="all">Tous les taux de rupture</option>
                        <option value="high">Taux de rupture &gt; 10%</option>
                        <option value="low">Taux de rupture &lt; 10%</option>
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
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("stockoutTasks")}
                                    role="button"
                                    aria-sort={sortConfig.key === "stockoutTasks" ? sortConfig.direction : "none"}
                                >
                                    Tâches de Rupture {sortConfig.key === "stockoutTasks" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("totalPickupTasks")}
                                    role="button"
                                    aria-sort={sortConfig.key === "totalPickupTasks" ? sortConfig.direction : "none"}
                                >
                                    Total Tâches de Prélèvement {sortConfig.key === "totalPickupTasks" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-3 text-left cursor-pointer"
                                    onClick={() => handleSort("stockoutRate")}
                                    role="button"
                                    aria-sort={sortConfig.key === "stockoutRate" ? sortConfig.direction : "none"}
                                >
                                    Taux de Rupture (%) {sortConfig.key === "stockoutRate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-3 text-center text-gray-500">
                                        Aucun article trouvé.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b ${item.turnoverRate > 1 || item.stockoutRate > 10
                                                ? "bg-yellow-100 text-yellow-700 font-semibold"
                                                : "even:bg-gray-50"
                                            }`}
                                    >
                                        <td className="p-3">{item.id}</td>
                                        <td className="p-3">
                                            {isNaN(item.totalExits) || item.totalExits === 0
                                                ? "_"
                                                : item.totalExits.toFixed(2)}
                                        </td>
                                        <td className="p-3">
                                            {isNaN(item.averageStock) || item.averageStock === 0
                                                ? "_"
                                                : item.averageStock.toFixed(2)}
                                        </td>
                                        <td className="p-3 flex items-center">
                                            {isNaN(item.turnoverRate) || item.turnoverRate === 0
                                                ? "_"
                                                : item.turnoverRate.toFixed(2)}
                                            {item.turnoverRate > 1 && (
                                                <span
                                                    className="ml-2 text-yellow-600"
                                                    aria-label="Alerte : taux de rotation élevé"
                                                >
                                                    ⚠️
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {isNaN(item.stockoutTasks) || item.stockoutTasks === 0
                                                ? "_"
                                                : item.stockoutTasks}
                                        </td>
                                        <td className="p-3">
                                            {isNaN(item.totalPickupTasks) || item.totalPickupTasks === 0
                                                ? "_"
                                                : item.totalPickupTasks}
                                        </td>
                                        <td className="p-3 flex items-center">
                                            {isNaN(item.stockoutRate) || item.stockoutRate === 0
                                                ? "_"
                                                : `${item.stockoutRate.toFixed(2)}%`}
                                            {item.stockoutRate > 10 && (
                                                <span
                                                    className="ml-2 text-red-600"
                                                    aria-label="Alerte : taux de rupture élevé"
                                                >
                                                    ⚠️
                                                </span>
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
                    <strong>Remarque :</strong> Les articles avec un taux de rotation supérieur à 1 ou un taux de rupture supérieur à 10% sont en surbrillance avec une alerte.
                </p>
            </div>
        </div>
    );
};

export default Rotations;