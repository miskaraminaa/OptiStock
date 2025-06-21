import { useState, useEffect } from 'react';
import axios from 'axios';

function Inventory() {
    const [inventories, setInventories] = useState([]);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [quantityCounted, setQuantityCounted] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        axios.get(`${API_URL}/inventory/list`)
            .then(response => setInventories(response.data.data))
            .catch(error => console.error('Erreur chargement inventaires :', error));
    }, [API_URL]);

    const startOrSelectInventory = (id) => {
        const inv = inventories.find(i => i.id === id);
        setSelectedInventory(inv);
        setQuantityCounted('');
        setNotes('');
        setMessage('Inventaire sélectionné.');
    };

    const updateInventory = async () => {
        if (!selectedInventory || !quantityCounted) {
            setMessage('Veuillez sélectionner un inventaire et entrer une quantité.');
            return;
        }

        try {
            await axios.post(`${API_URL}/inventory/update`, {
                inventory_id: selectedInventory.id,
                quantity_counted: parseFloat(quantityCounted),
                notes
            });
            setMessage('Inventaire mis à jour avec succès.');
            setQuantityCounted('');
            setNotes('');
            // Rafraîchir la liste
            const response = await axios.get(`${API_URL}/inventory/list`);
            setInventories(response.data.data);
            setSelectedInventory(null);
        } catch (error) {
            setMessage('Erreur lors de la mise à jour : ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Gestion de l'Inventaire</h2>
            {inventories.length > 0 ? (
                <div className="overflow-x-auto mb-4">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Article</th>
                                <th>Longueur</th>
                                <th>Largeur</th>
                                <th>Hauteur</th>
                                <th>Poids</th>
                                <th>Quantité Théorique</th>
                                <th>Quantité Comptée</th>
                                <th>Écart</th>
                                <th>Statut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventories.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.id_article}</td>
                                    <td>{inv.longueur || 'N/A'}</td>
                                    <td>{inv.largeur || 'N/A'}</td>
                                    <td>{inv.hauteur || 'N/A'}</td>
                                    <td>{inv.poids || 'N/A'}</td>
                                    <td>{inv.quantity_theoretical}</td>
                                    <td>{inv.quantity_counted || 'N/A'}</td>
                                    <td>{inv.discrepancy || 'N/A'}</td>
                                    <td>{inv.status}</td>
                                    <td>
                                        <button
                                            onClick={() => startOrSelectInventory(inv.id)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Sélectionner
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Aucun inventaire disponible. Vérifiez les données dans la table dimensions.</p>
            )}
            {selectedInventory && (
                <div>
                    <p>Article : {selectedInventory.id_article}</p>
                    <input
                        type="number"
                        value={quantityCounted}
                        onChange={(e) => setQuantityCounted(e.target.value)}
                        placeholder="Quantité comptée"
                        className="input input-bordered w-full mb-4"
                    />
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes"
                        className="textarea textarea-bordered w-full mb-4"
                    />
                    <button
                        onClick={updateInventory}
                        className="btn btn-primary"
                    >
                        Mettre à Jour
                    </button>
                </div>
            )}
            {message && <p className="mt-4">{message}</p>}
        </div>
    );
}

export default Inventory;