const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const { excelDateToJSDate } = require('../utils/excelHelpers');

// Configure CORS
router.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Set request timeout (30 seconds)
router.use((req, res, next) => {
    res.setTimeout(3000000, () => {
        console.error('Request timed out');
        return res.status(504).json({ message: 'Request timed out' });
    });
    next();
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log('Multer File:', file);
        const ext = path.extname(file.originalname).toLowerCase();
        console.log('File Extension:', ext);
        if (ext !== '.xls' && ext !== '.xlsx') {
            console.log('File rejected: Invalid extension');
            return cb(new Error('Only Excel files are allowed'));
        }
        console.log('File accepted');
        cb(null, true);
    },
});

// File type to table mapping
const fileTypeToTable = {
    LE: 'le_status',
    LET: 'le_tache',
    LS: 'ls_status',
    LST: 'ls_tache',
    MB51: 'mb51',
    STOCK_EWM: 'stock_ewm',
    STOCK_IAM: 'stock_iam',
};

// Column mappings (unchanged from your provided code)
const columnMappings = {
    le_status: {
        "Bloqué (global)": "bloque_global",
        "Document": "Document",
        "Type de document": "type_document",
        "Description du type de document": "description_type_document",
        "Généré manuellement": "genere_manuellement",
        "Véhicule": "vehicule",
        "Unité de transport": "unite_transport",
        "Exécution logistique : livraison": "execution_logistique_livraison",
        "Commande d'achat": "commande_achat",
        "Numéro RMA": "numero_rma",
        "Ordre de production": "ordre_production",
        "Avis de livraison": "avis_livraison",
        "Statut activité magasin": "statut_activite_magasin",
        "Statut transit": "statut_transit",
        "Statut entrée de stock": "statut_entree_stock",
        "Statut d'entrée en stock (plan)": "statut_entree_stock_plan",
        "Statut de l'entrée de marchandises": "statut_entree_marchandises",
        "Déchargement": "dechargement",
        "Procédure envoi": "procedure_envoi",
        "Lettre de voiture": "lettre_voiture",
        "Numéro PRO": "numero_pro",
        "Document de fret": "document_fret",
        "Transporteur": "transporteur",
        "Porte magasin": "porte_magasin",
        "Point de déchargement": "point_dechargement",
        "Exp. marchandises": "exp_marchandises",
        "Site cédant": "site_cedant",
        "Réceptionnaire définitif marchandises": "receptionnaire_definitif_marchandises",
        "Bureau réception": "bureau_reception",
        "Points de priorité": "points_priorite",
        "Nombre de postes": "nombre_postes",
        "Nombre d'unités de manutention": "nombre_unites_manutention",
        "Nombre de produits": "nombre_produits",
        "Date de livraison (planifiée)": "date_livraison_planifiee",
        "Heure de livraison (planifiée)": "heure_livraison_planifiee",
        "Date planifiée entrée des marchandises": "date_planifiee_entree_marchandises",
        "Hre planif. entrée marchandise": "heure_planifiee_entree_marchandises",
        "Date de la livraison sortante": "date_livraison_sortante",
        "Heure de livraison sortante": "heure_livraison_sortante",
        "Numéro d'opération TCD": "numero_operation_tcd",
        "Type de planification du transport": "type_planification_transport",
        "Description du transporteur": "description_transport",
        "Description de l'expéditeur marchandises": "description_expediteur_marchandises",
        "Description du site cédant": "description_site_cedant",
        "Description réceptionnaire final marchandises": "description_receptionnaire_final_marchandises",
        "Statut sortie entrée et répartition": "statut_sortie_entree_repartition",
        "Statut de déchargement et de répartition": "statut_dechargement_repartition",
        "Statut déchargt planif. et répartition": "statut_dechargement_planifie_repartition",
        "Statut entrée en stock plan. et répart.": "statut_entree_stock_planifie_reparti",
        "Statut d'entrée en stock et répartition": "statut_entree_stock_repartition",
        "Refusé": "refuse",
        "Créé le": "cree_le",
        "Créé(e) à": "cree_a",
        "Créé par": "cree_par",
        "avis de livraison": "avis_livraison",
        "statut transit": "statut_transit",
        "statut entrée de stock": "statut_entree_stock",
        "statut d'entrée en stock (plan)": "statut_entree_stock_plan",
        "statut de l'entrée de marchandises": "statut_entree_marchandises",
        "déchargement": "dechargement",
        "lettre de voiture": "lettre_voiture",
        "numéro pro": "numero_pro",
        "point de déchargement": "point_dechargement",
        "exp. marchandises": "exp_marchandises",
        "site cédant": "site_cedant",
        "bureau réception": "bureau_reception",
        "description de l'expéditeur marchandises": "description_expediteur_marchandises",
        "description du site cédant": "description_site_cedant",
        "statut sortie entrée et répartition": "statut_sortie_entree_repartition",
        "statut de déchargement et de répartition": "statut_dechargement_repartition",
        "statut déchargt planif. et répartition": "statut_dechargement_planifie_repartition",
        "statut entrée en stock plan. et répart.": "statut_entree_stock_planifie_reparti",
        "statut d'entrée en stock et répartition": "statut_entree_stock_repartition",
        "refusé": "refuse"
    },
    le_tache: {
        "Tâche magasin": "Tache_magasin",
        "Produit": "Produit",
        "Désignation du produit": "Designation_produit",
        "Qté théo. céd. UQA": "Qte_theo_ced_UQA",
        "Type de stock": "Type_stock",
        "Emplacement prenant": "Emplacement_prenant",
        "Emplacement cédant": "Emplacement_cedant",
        "Document": "Document",
        "Date de création": "Date_creation",
        "Contrôle qualité": "Controle_qualite",
        "Poste tâche magasin": "Poste_tache_magasin",
        "Tâche magasin UM": "Tache_magasin_UM",
        "Type processus maga.": "Type_processus_magasin",
        "Catég.processus mag.": "Categ_processus_magasin",
        "Descr. catég. process. magasin": "Descr_categ_process_magasin",
        "Activité": "Activite",
        "Processus stockage": "Processus_stockage",
        "Etape externe du processus": "Etape_externe_du_processus",
        "Statut de la tâche magasin": "Statut_tache_magasin",
        "Créé par": "Cree_par",
        "Heure de création": "Heure_creation",
        "Confirmé par": "Confirme_par",
        "Date de confirmation": "Date_confirmation",
        "Heure confirmation": "Heure_confirmation",
        "Ressource exécutante": "Ressource_executante",
        "Motif du mouvement": "Motif_mouvement",
        "Code d'exception": "Code_exception",
        "Date de début": "Date_debut",
        "Heure de début": "Heure_debut",
        "Lot": "Lot",
        "Désignation du type de stock": "Designation_type_stock",
        "Type": "Type",
        "Commande client/projet": "Commande_client_projet",
        "Poste cde client": "Poste_cde_client",
        "Catégorie document": "Categorie_document",
        "Utilisation": "Utilisation",
        "Propriétaires": "Proprietaires",
        "Rôle partenaire": "Role_partenaire",
        "Personne autorisée à disposer": "Personne_autorisee_a_disposer",
        "Qté théor. céd. UQB": "Qte_theo_ced_UQB",
        "Qté réelle pr. UQB": "Qte_reelle_pren_UQB",
        "Qté écart en UQB": "Qte_ecart_UQB",
        "Unité de qté base": "Unite_qte_base",
        "Qté réelle pren. UQA": "Qte_reelle_pren_UQA",
        "Qté écart pren. UQA": "Qte_ecart_pren_UQA",
        "Uté de qté altern.": "Ute_qte_altern",
        "Qté réelle pr. ds UQ à PV": "Qte_reelle_pr_ds_UQ_PV",
        "Uté qté à poids var.": "Ute_qte_a_poids_var",
        "Evaluation mesurée": "Evaluation_mesuree",
        "Quantité écart ds UQ à PV": "Quantite_ecart_ds_UQ_PV",
        "Statut écart ds qté PV exacte": "Statut_ecart_qte_PV_exacte",
        "Groupe de combinaisons": "Groupe_combinaisons",
        "Type uté manutention": "Type_ute_manutention",
        "Évaluat. du danger 1": "Evaluation_danger_1",
        "Éval. du danger 2": "Evaluation_danger_2",
        "Poids de chargement": "Poids_chargement",
        "Unité de poids": "Unite_poids",
        "Volume de chargement": "Volume_chargement",
        "Unité de volume": "Unite_volume",
        "Consomm. capacité": "Consomm_capacite",
        "Charges théor. TM": "Charges_theor_TM",
        "Unité de temps": "Unite_temps",
        "Inventaire d'entrée planifié": "Inventaire_entree_planifie",
        "Inventaire d'entrée": "Inventaire_entree",
        "Contrôle stock insuffisant planifié": "Controle_stock_insuffisant_planifie",
        "Contrôle du stock insuffisant": "Controle_stock_insuffisant",
        "Date d'expiration/DLC": "Date_expiration_DLC",
        "Date de l'entrée de marchandises": "Date_entree_marchandises",
        "Temps de réception": "Temps_reception",
        "Pays d'origine": "Pays_origine",
        "Matière dangereuse : pertin. pr stockage": "Matiere_dangereuse_stockage",
        "Type d'inspection": "Type_inspection",
        "Cible identif. du stock": "Cible_identif_stock",
        "Type magasin cédant": "Type_magasin_cedant",
        "Aire stock. cédante": "Aire_stock_cedante",
        "Poste cédant log. de l'UM": "Poste_cedant_log_UM",
        "Ressouce cédante": "Ressource_cedante",
        "Uté trnsp. céd. int.": "Ute_trnsp_ced_int",
        "Unité de transport cédante": "Unite_transport_cedante",
        "Transporteur cédant": "Transporteur_cedant",
        "Cat. site cédante": "Cat_site_cedante",
        "Unité manut. cédante": "Unite_manut_cedante",
        "Quantité à conserver": "Quantite_a_conserver",
        "Type magasin prenant": "Type_magasin_prenant",
        "Aire stockage pren.": "Aire_stockage_prenant",
        "Poste prenant logique UM": "Poste_prenant_logique_UM",
        "Position de l'équipement de distr. (TM)": "Position_equipement_distribution_TM",
        "Ressource prenante": "Ressource_prenante",
        "Uté trsp. pren.int.": "Ute_trsp_pren_int",
        "Unité de transport prenante": "Unite_transport_prenante",
        "Transporteur prenant": "Transporteur_prenant",
        "Catégorie site pren.": "Categorie_site_prenant",
        "Unité manut. pren.": "Unite_manut_prenante",
        "Empl. pren. d'orig.": "Empl_pren_orig",
        "Prélèvem. UM compl.": "Prelevement_UM_complet",
        "TM à sous-système": "TM_sous_systeme",
        "Prélever stock total de l'emplacement": "Prelever_stock_total_emplacement"
    },
    ls_status: {
        "Bloqué (global)": "bloque_global",
        "Bloque (global)": "bloque_global",
        "Bloqué (global) ": "bloque_global",
        "Document": "Document",
        "document": "Document",
        "Type de document": "type_document",
        "Description du type de document": "description_type_document",
        "Généré manuellement": "genere_manuellement",
        "Véhicule": "vehicule",
        "Unité de transport": "unite_transport",
        "Transporteur": "transporteur",
        "Bureau d'expédition": "bureau_expedition",
        "Récept. march.": "recept_march",
        "Site prenant": "site_prenant",
        "Réceptionnaire définitif marchandises": "receptionnaire_definitif_marchandises",
        "Nombre de postes": "nombre_postes",
        "Nombre d'unités de manutention": "nombre_unites_manutention",
        "Nombre de produits": "nombre_produits",
        "Itinéraire": "itineraire",
        "Calendrier de départ/Tournée": "calendrier_depart_tournee",
        "Origine données de base itin.": "origine_donnees_base_itin",
        "Date de départ planifiée": "date_depart_itineraire_planifiee",
        "Hre départ itinéraire planif.": "heure_depart_itineraire_planifiee",
        "Appartenance à vague de prélèvement": "appartenance_vague_prelevement",
        "Porte magasin": "porte_magasin",
        "Statut activité magasin": "statut_activite_magasin",
        "Statut du prélèvement": "statut_prelevement",
        "Statut prélèvement (plan)": "statut_prelevement_plan",
        "Statut emballage": "statut_emballage",
        "Charger": "charger",
        "Statut sortie de marchandises": "statut_sortie_marchandises",
        "Statut détermination de l'itinéraire": "statut_determination_itineraire",
        "Procédure envoi": "procedure_envoi",
        "Terminé": "termine",
        "Commande client": "commande_client",
        "Numéro RMA": "numero_rma",
        "Commande d'achat": "commande_achat",
        "Ordre de production": "ordre_production",
        "Exécution logistique : livraison": "execution_logistique_livraison",
        "Document d'origine ERP": "document_origine_erp",
        "Cde achat répart. march.": "commande_achat_repartition_marchandise",
        "Lettre de voiture": "lettre_voiture",
        "Numéro d'opération TCD": "numero_operation_tcd",
        "Document de fret": "document_fret",
        "Date de livraison": "date_livraison_planifiee",
        "Heure de livraison": "heure_livraison_planifiee",
        "Date de livraison définitive": "date_livraison_definitive",
        "Heure de livraison définitive": "heure_livraison_definitive",
        "Type de planification du transport": "type_planification_transport",
        "Description du transporteur": "description_transporteur",
        "Description réceptionnaire marchandises": "description_reception_marchandises",
        "Description du site prenant": "description_site_prenant",
        "Descr. réceptionnaire final marchandises": "description_receptionnaire_final_marchandise",
        "Statut prél. march. et répart. du plan": "statut_prelevement_repartition_plan",
        "Statut de prélèvement et de répartition": "statut_prelevement_et_repartition",
        "Statut \"Embal. prêt pr envoi et répart.\"": "statut_emballage_pret_envoi_repartition",
        "Statut pr mise à dispo. et répartition": "statut_mise_disposition_repartition",
        "Statut de chargement et de répartition": "statut_chargement_et_repartition",
        "Statut sortie march. et répartition": "statut_sortie_marchandises_repartition",
        "Créé le": "cree_le",
        "Créé(e) à": "cree_a",
        "Cree(e) a": "cree_a",
        "Numéro de séquence": "numero_sequence",
        "Pertinence des marchandises dangereuses": "pertinence_marchandises_dangereuses",
        "Créé par": "cree_par",
        "Bloqué (global) ": "bloque_global",
        "Document ": "Document",
        "Nombre de postes ": "nombre_postes",
        "Statut activité magasin ": "statut_activite_magasin",
        "Statut du prélèvement ": "statut_prelevement",
        "Statut sortie de marchandises ": "statut_sortie_marchandises",
        "Terminé ": "termine",
        "Commande client ": "commande_client",
        "Commande d'achat ": "commande_achat",
        "Créé le ": "cree_le",
        "Créé(e) à ": "cree_a",
        "Créé par ": "cree_par"
    },
    ls_tache: {
        "Tâche magasin": "Tache_magasin",
        "Produit": "Produit",
        "Désignation du produit": "Designation_produit",
        "Qté théo. céd. UQA": "Qte_theo_ced_UQA",
        "Type de stock": "Type_stock",
        "Emplacement prenant": "Emplacement_prenant",
        "Emplacement cédant": "Emplacement_cedant",
        "Document": "Document",
        "Date de création": "Date_creation",
        "Contrôle qualité": "Controle_qualite",
        "Poste tâche magasin": "Poste_tache_magasin",
        "Tâche magasin UM": "Tache_magasin_UM",
        "Type processus maga.": "Type_processus_magasin",
        "Catég.processus mag.": "Categ_processus_magasin",
        "Descr. catég. process. magasin": "Descr_categ_process_magasin",
        "Activité": "Activite",
        "Processus stockage": "Processus_stockage",
        "Etape externe du processus": "Etape_externe_du_processus",
        "Statut de la tâche magasin": "Statut_tache_magasin",
        "Créé par": "Cree_par",
        "Heure de création": "Heure_creation",
        "Confirmé par": "Confirme_par",
        "Date de confirmation": "Date_confirmation",
        "Heure confirmation": "Heure_confirmation",
        "Ressource exécutante": "Ressource_executante",
        "Motif du mouvement": "Motif_mouvement",
        "Code d'exception": "Code_exception",
        "Date de début": "Date_debut",
        "Heure de début": "Heure_debut",
        "Lot": "Lot",
        "Désignation du type de stock": "Designation_type_stock",
        "Type": "Type",
        "Commande client/projet": "Commande_client_projet",
        "Poste cde client": "Poste_cde_client",
        "Catégorie document": "Categorie_document",
        "Utilisation": "Utilisation",
        "Propriétaires": "Proprietaires",
        "Rôle partenaire": "Role_partenaire",
        "Personne autorisée à disposer": "Personne_autorisee_a_disposer",
        "Qté théor. céd. UQB": "Qte_theo_ced_UQB",
        "Qté réelle pr. UQB": "Qte_reelle_pren_UQB",
        "Qté écart en UQB": "Qte_ecart_UQB",
        "Unité de qté base": "Unite_qte_base",
        "Qté réelle pren. UQA": "Qte_reelle_pren_UQA",
        "Qté écart pren. UQA": "Qte_ecart_pren_UQA",
        "Uté de qté altern.": "Ute_qte_altern",
        "Qté réelle pr. ds UQ à PV": "Qte_reelle_pr_ds_UQ_PV",
        "Uté qté à poids var.": "Ute_qte_a_poids_var",
        "Evaluation mesurée": "Evaluation_mesuree",
        "Quantité écart ds UQ à PV": "Quantite_ecart_ds_UQ_PV",
        "Statut écart ds qté PV exacte": "Statut_ecart_qte_PV_exacte",
        "Groupe de combinaisons": "Groupe_combinaisons",
        "Type uté manutention": "Type_ute_manutention",
        "Évaluat. du danger 1": "Evaluation_danger_1",
        "Éval. du danger 2": "Evaluation_danger_2",
        "Poids de chargement": "Poids_chargement",
        "Unité de poids": "Unite_poids",
        "Volume de chargement": "Volume_chargement",
        "Unité de volume": "Unite_volume",
        "Consomm. capacité": "Consomm_capacite",
        "Charges théor. TM": "Charges_theor_TM",
        "Unité de temps": "Unite_temps",
        "Inventaire d'entrée planifié": "Inventaire_entree_planifie",
        "Inventaire d'entrée": "Inventaire_entree",
        "Contrôle stock insuffisant planifié": "Controle_stock_insuffisant_planifie",
        "Contrôle du stock insuffisant": "Controle_stock_insuffisant",
        "Date d'expiration/DLC": "Date_expiration_DLC",
        "Date de l'entrée de marchandises": "Date_entree_marchandises",
        "Temps de réception": "Temps_reception",
        "Pays d'origine": "Pays_origine",
        "Matière dangereuse : pertin. pr stockage": "Matiere_dangereuse_stockage",
        "Type d'inspection": "Type_inspection",
        "Cible identif. du stock": "Cible_identif_stock",
        "Type magasin cédant": "Type_magasin_cedant",
        "Aire stock. cédante": "Aire_stock_cedante",
        "Poste cédant log. de l'UM": "Poste_cedant_log_UM",
        "Ressouce cédante": "Ressource_cedante",
        "Uté trnsp. céd. int.": "Ute_trnsp_ced_int",
        "Unité de transport cédante": "Unite_transport_cedante",
        "Transporteur cédant": "Transporteur_cedant",
        "Cat. site cédante": "Cat_site_cedante",
        "Unité manut. cédante": "Unite_manut_cedante",
        "Quantité à conserver": "Quantite_a_conserver",
        "Type magasin prenant": "Type_magasin_prenant",
        "Aire stockage pren.": "Aire_stockage_prenant",
        "Poste prenant logique UM": "Poste_prenant_logique_UM",
        "Position de l'équipement de distr. (TM)": "Position_equipement_distribution_TM",
        "Ressource prenante": "Ressource_prenante",
        "Uté trsp. pren.int.": "Ute_trsp_pren_int",
        "Unité de transport prenante": "Unite_transport_prenante",
        "Transporteur prenant": "Transporteur_prenant",
        "Catégorie site pren.": "Categorie_site_prenant",
        "Unité manut. pren.": "Unite_manut_prenante",
        "Empl. pren. d'orig.": "Empl_pren_orig",
        "Prélèvem. UM compl.": "Prelevement_UM_complet",
        "TM à sous-système": "TM_sous_systeme",
        "Prélever stock total de l'emplacement": "Prelever_stock_total_emplacement"
    },
    mb51: {
        "Référence": "reference",
        "Document article": "document_article",
        "Date comptable": "date_comptable",
        "Article": "article",
        "Division": "division",
        "Désignation article": "designation_article",
        "Code mouvement": "code_mouvement",
        "Qté en unité saisie": "qte_en_unite_saisie",
        "Ordre": "ordre",
        "UQA de saisie": "uq_de_saisie",
        "Montant DI": "montant_di",
        "Date de saisie": "date_saisie",
        "Heure de saisie": "heure_saisie",
        "Nom de l'utilisateur": "nom_de_l_utilisateur",
        "Commande d'achat": "commande_achat",
        "Quantité": "quantite",
        "Lot": "lot",
        "Magasin": "magasin",
        "Nom 1": "nom_1",
        "Texte code mouvement": "texte_code_mouvement",
        "Stock spécial": "stock_special",
        "Exercice doc.article": "exercice_doc_article",
        "Poste doc. article": "poste_doc_article",
        "Société": "societe",
        "Bon d'accompagnement": "bon_d_accompagnement",
        "Centre de coûts": "centre_de_couts",
        "Client": "client",
        "Code débit/crédit": "code_debit_credit",
        "Code entrée magasin": "code_entree_magasin",
        "Code origine mvmt.": "code_origine_mouvement",
        "Commande client": "commande_client",
        "Commande client (2)": "commande_client_2",
        "Compteur": "compteur",
        "Consommation": "consommation",
        "Date document": "date_document",
        "Devise": "devise",
        "Échéance cde client": "echeance_cde_client",
        "Elément d'OTP": "element_d_otp",
        "Groupe valorisation": "groupe_valorisation",
        "Immobilisation": "immobilisation",
        "Imputation multiple": "imputation_multiple",
        "Montant saisi par util., DI": "montant_saisi_utilisateur_di",
        "Motif du mouvement": "motif_mouvement",
        "N° poste réservation trsf.": "poste_reservation_transfert",
        "Nº de document configurable": "doc_configurable",
        "Numéro de la gamme opérations": "num_gamme_operations",
        "Numéro subsidiaire": "numero_subsidiaire",
        "Opération": "operation",
        "Poste": "poste",
        "Poste cde client": "poste_cde_client",
        "Poste cde client (2)": "poste_cde_client_2",
        "Poste d'origine": "poste_origine",
        "Poste généré automatiquement": "poste_genere_auto",
        "Qté en unité achat": "qte_en_unite_achat",
        "Qté unité prx": "qte_unite_prx",
        "Réseau": "reseau",
        "Réservation": "reservation",
        "Segment de stock": "segment_stock",
        "Texte d'en-tête document": "texte_entete_document",
        "Type d'opération": "type_d_operation",
        "Unité d'achat": "unite_achat",
        "Unité de prix": "unite_de_prix",
        "Unité de qté base": "unite_de_qte_base",
        "Valeur au PV, +TVA": "valeur_au_pv_tva",
        "Valeur de vente": "valeur_vente",
        "Fournisseur": "fournisseur"
    },
    mouvement: {
        "Organisation": "organisation",
        "ID": "mouvement_ref_id",
        "Magasin": "magasin",
        "Emplacement": "emplacement",
        "Article": "article",
        "Description article": "description_article",
        "UdM": "udm",
        "Origine": "origine",
        "Date mouvement": "date_mouvement",
        "Date creation": "date_creation",
        "Type mouvement": "type_mouvement",
        "CCF": "ccf",
        "Qte mouvement": "qte_mouvement",
        "Prix d'entree": "prix_entree",
        "PMP": "pmp",
        "Mouvement ID": "mouvement_id",
        "Cree par": "cree_par",
        "Commande/OT": "commande_ot",
        "Numero d'equipement": "numero_equipement",
        "Service": "service",
        "Valorise": "valorise",
        "Categorie": "categorie",
        "Matricule Personnel": "matricule_personnel",
        "Matricule Tiers": "matricule_tiers",
        "Matricule Immobilisation": "matricule_immobilisation",
        "Matricule FA": "matricule_fa"
    },
    stock_ewm: {
        "Article": "article",
        "Désignation Article": "designation_article",
        "Numéro de Magasin": "numero_magasin",
        "Division": "division",
        "Magasin": "magasin",
        "Emplacement": "emplacement",
        "Type de Magasin": "type_magasin",
        "Quantité": "quantite",
        "Unité Qté de Base": "unite_qte_base",
        "Type de Stock": "type_stock",
        "Désign. type stock": "designation_type_stock",
        "Groupe Valorisation": "groupe_valorisation",
        "Prix": "prix",
        "Valeur de Stock": "valeur_stock",
        "Devise": "devise",
        "Date EM": "date_em",
        "Dernière Sortie": "derniere_sortie"
    },
    stock_iam: {
        "Numéro d'article": "numero_article",
        "Description d'article": "description_article",
        "Division": "division",
        "Nom de la division": "nom_division",
        "Magasin": "magasin",
        "Description du magasin": "description_magasin",
        "Type de stock spécial": "type_stock_special",
        "Stock à utilisation libre": "stock_utilisation_libre",
        "Stock en contrôle qualité": "stock_controle_qualite",
        "Stock bloqué": "stock_bloque",
        "Date de reporting": "date_reporting",
        "Valeur actuelle du stock à utilisation libre": "valeur_stock_utilisation_libre",
        "Valeur actuelle du stock bloqué": "valeur_stock_bloque",
        "Valeur du stock à utilisation libre": "valeur_stock_utilisation_libre",
        "Valeur du stock bloqué": "valeur_stock_bloque"
    }
};

// Debug columnMappings
console.log('Loaded columnMappings.le_status keys:', Object.keys(columnMappings.le_status));

// Enhanced normalizeHeader function
const normalizeHeader = (header) => {
    if (typeof header !== 'string') {
        console.warn('Non-string header encountered:', header, 'Type:', typeof header);
        return '';
    }
    const normalized = header
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s\u00A0]+/g, ' ')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .toLowerCase();
    console.log(`Header "${header}" normalized to "${normalized}", char codes:`,
        Array.from(header).map(c => c.charCodeAt(0)));
    return normalized;
};

// Sanitize file name
const sanitizeFileName = (fileName) => {
    return fileName
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/__+/g, '_')
        .trim();
};

const sanitizeValue = (value, columnType, columnName, tableName) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    if (tableName === 'stock_ewm' && columnName === 'date_em' && typeof value === 'string') {
        const dateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
        if (dateMatch) {
            const [, day, month, year, hour, minute, second] = dateMatch;
            const date = new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
            return date.toISOString().split('T')[0];
        }
        console.warn(`Invalid date format for ${columnName} value ${value}`);
        return null;
    }

    if (tableName === 'stock_iam' && columnName === 'date_reporting') {
        if (typeof value === 'number') {
            try {
                const date = excelDateToJSDate(value);
                return date.toISOString().split('T')[0];
            } catch (error) {
                console.warn(`Date conversion failed for ${columnName} value ${value}:`, error.message);
                return null;
            }
        } else if (typeof value === 'string') {
            const formats = ['%d/%m/%Y', '%Y-%m-%d'];
            for (const format of formats) {
                const dateMatch = value.match(/^\d{2}\/\d{2}\/\d{4}$/) || value.match(/^\d{4}-\d{2}-\d{2}$/);
                if (dateMatch) {
                    try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0];
                        }
                    } catch (error) {
                        console.warn(`Invalid date format for ${columnName} value ${value} with format ${format}`);
                    }
                }
            }
            console.warn(`Invalid date format for ${columnName} value ${value}`);
            return null;
        }
        return null;
    }

    if (columnType.includes('date') && typeof value === 'number') {
        try {
            const date = excelDateToJSDate(value);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn(`Date conversion failed for ${columnName} value ${value}:`, error.message);
            return null;
        }
    }

    if (columnType.includes('time') && typeof value === 'string') {
        const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const seconds = timeMatch[3] || '00';
            const period = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
            if (period) {
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
        }
        return null;
    }

    if (columnType.includes('tinyint') || columnType.includes('boolean')) {
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (['true', '1', 'yes', 'oui'].includes(lowerValue)) return 1;
            if (['false', '0', 'no', 'non'].includes(lowerValue)) return 0;
        }
        return value ? 1 : 0;
    }

    if (columnType.includes('int') || columnType.includes('decimal') || columnType.includes('float')) {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? null : numValue;
    }

    if (columnType.includes('varchar') || columnType.includes('text')) {
        const strValue = String(value).trim();
        if (columnType.includes('varchar')) {
            const maxLength = parseInt(columnType.match(/varchar\((\d+)\)/)?.[1] || 255);
            return strValue.length > maxLength ? strValue.substring(0, maxLength) : strValue;
        }
        return strValue;
    }
    return value;
};

// GET route
router.get('/', async (req, res) => {
    console.log('Starting GET /uploads');
    try {
        const stats = {
            supportedFileTypes: Object.keys(fileTypeToTable),
            maxFileSize: '10MB',
            allowedExtensions: ['.xls', '.xlsx']
        };
        return res.json({
            message: 'File upload endpoint ready',
            stats,
            usage: 'Use POST to upload Excel files with type parameter'
        });
    } catch (err) {
        console.error('GET /uploads error:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST route
router.post('/', upload.single('file'), async (req, res) => {
    console.log('Starting POST /uploads:', { file: req.file?.originalname, type: req.body.type, mimetype: req.file?.mimetype });
    try {
        const file = req.file;
        const { type } = req.body;

        if (!file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!type || !fileTypeToTable[type]) {
            console.log('Invalid file type:', type);
            return res.status(400).json({
                message: 'Invalid or missing file type',
                supportedTypes: Object.keys(fileTypeToTable)
            });
        }

        console.log('Processing file:', file.originalname, 'Type:', type);
        const tableName = fileTypeToTable[type];
        const columnMapping = columnMappings[tableName];
        const fileName = sanitizeFileName(file.originalname);
        console.log('Sanitized file name:', fileName);
        console.log('Using table:', tableName);

        if (!columnMapping) {
            console.error(`No column mapping defined for table: ${tableName}`);
            return res.status(400).json({
                message: `No column mapping defined for table ${tableName}`,
                supportedTables: Object.keys(columnMappings)
            });
        }

        const allowedMimeTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.log('Invalid MIME type:', file.mimetype);
            return res.status(400).json({
                message: 'Invalid file type. Only Excel files (.xls, .xlsx) are allowed',
                receivedType: file.mimetype
            });
        }

        console.log('Fetching table schema for:', tableName);
        let columnTypes = {};
        let requiredColumns = [];
        let validMetadataColumns = [];
        try {
            const [columnsResult] = await db.query('DESCRIBE ??', [tableName]);
            columnTypes = columnsResult.reduce((acc, col) => {
                acc[col.Field] = col.Type.toLowerCase();
                return acc;
            }, {});
            requiredColumns = columnsResult
                .filter(col => col.Null === 'NO' && !col.Default && col.Extra !== 'auto_increment')
                .map(col => col.Field);
            validMetadataColumns = ['name_file', 'uploaded_at'].filter(col => columnTypes[col]);
            console.log('Table columns:', Object.keys(columnTypes));
            console.log('Required columns:', requiredColumns);
            console.log('Valid metadata columns:', validMetadataColumns);
        } catch (schemaError) {
            console.error('Schema error:', schemaError);
            return res.status(500).json({
                message: `Database schema error: Table ${tableName} may not exist`,
                error: schemaError.message,
                sql: schemaError.sql,
                code: schemaError.code
            });
        }

        if (columnTypes['name_file']) {
            console.log('Checking for duplicate file in imported_file:', fileName);
            try {
                const [rows] = await db.query(
                    'SELECT COUNT(*) AS count FROM imported_file WHERE fichier_name = ?',
                    [fileName]
                );
                if (rows[0].count > 0) {
                    console.log('Duplicate file found in imported_file');
                    return res.status(409).json({
                        message: 'File already exists in imported_file table',
                        fileName
                    });
                }
            } catch (error) {
                console.error('Database check error:', error);
                return res.status(500).json({
                    message: 'Database error during file check',
                    error: error.message,
                    sql: error.sql,
                    code: error.code
                });
            }
        } else {
            console.log(`No name_file column in ${tableName}; skipping duplicate check`);
        }

        const caseInsensitiveMapping = {};
        const validColumnMapping = {};
        const missingColumns = [];
        for (const [excelCol, dbCol] of Object.entries(columnMapping)) {
            if (columnTypes[dbCol]) {
                validColumnMapping[excelCol] = dbCol;
                const normalizedKey = normalizeHeader(excelCol);
                caseInsensitiveMapping[normalizedKey] = dbCol;
                console.log(`Mapped "${excelCol}" (normalized: "${normalizedKey}") to "${dbCol}"`);
            } else {
                missingColumns.push(dbCol);
                console.warn(`Column "${dbCol}" not found in table ${tableName}`);
            }
        }
        console.log('Case-insensitive mapping:', JSON.stringify(caseInsensitiveMapping, null, 2));
        if (Object.keys(validColumnMapping).length === 0) {
            console.error('No valid columns mapped');
            return res.status(400).json({
                message: 'No valid columns mapped to the database table',
                missingColumns
            });
        }
        if (missingColumns.length > 0) {
            console.warn(`Missing columns in ${tableName}:`, missingColumns);
        }

        console.log('Reading Excel file');
        let workbook, data;
        try {
            workbook = XLSX.read(file.buffer, { type: 'buffer', cellText: false, cellDates: true });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                console.log('No sheets found in Excel file');
                return res.status(400).json({ message: 'Excel file has no sheets' });
            }
            data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' });
            if (data.length === 0) {
                console.log('Excel file is empty');
                return res.status(400).json({ message: 'Excel file is empty or has no data rows' });
            }
        } catch (excelError) {
            console.error('Excel parsing error:', excelError);
            return res.status(400).json({
                message: 'Error reading Excel file',
                error: excelError.message
            });
        }

        console.log('Processing Excel rows');
        const successData = [];
        const failureData = [];
        let processedCount = 0;

        for (let i = 0; i < data.length; i++) {
            try {
                const rowData = data[i];
                const mappedData = {};

                let hasValidData = false;
                const unmatchedHeaders = [];
                for (const [excelColumn, value] of Object.entries(rowData)) {
                    const normalizedExcelColumn = normalizeHeader(excelColumn);
                    const dbColumn = caseInsensitiveMapping[normalizedExcelColumn];
                    if (dbColumn) {
                        const columnType = columnTypes[dbColumn] || '';
                        const sanitizedValue = sanitizeValue(value, columnType, dbColumn, tableName);
                        mappedData[dbColumn] = sanitizedValue;
                        hasValidData = true;
                    } else {
                        unmatchedHeaders.push({ excelColumn, normalized: normalizedExcelColumn });
                    }
                }

                if (unmatchedHeaders.length > 0) {
                    console.log(`Row ${i + 2}: Unmatched headers:`, JSON.stringify(unmatchedHeaders, null, 2));
                }

                if (!hasValidData || Object.keys(mappedData).length === 0) {
                    console.log(`Row ${i + 2}: No valid columns mapped`);
                    failureData.push({
                        rowIndex: i + 2,
                        error: 'No valid columns mapped',
                        unmatchedHeaders,
                        rawData: rowData
                    });
                    continue;
                }

                if (tableName === 'le_tache') {
                    const produitValue = mappedData.Produit;
                    const trimmedProduit = typeof produitValue === 'string' ? produitValue.trim() : produitValue;
                    if (!trimmedProduit || trimmedProduit === '' || trimmedProduit === null || trimmedProduit === undefined) {
                        console.log(`Row ${i + 2}: Skipped due to invalid Produit value:`, {
                            rawValue: produitValue,
                            trimmedValue: trimmedProduit,
                            rawData: rowData
                        });
                        failureData.push({
                            rowIndex: i + 2,
                            error: 'Invalid Produit value (NULL, empty, or whitespace)',
                            unmatchedHeaders,
                            rawData: rowData
                        });
                        continue;
                    }
                    mappedData.Produit = trimmedProduit;
                }
                if (validMetadataColumns.includes('name_file') && !mappedData.name_file) {
                    mappedData.name_file = fileName;
                    console.log(`Row ${i + 2}: Added name_file metadata: ${fileName}`);
                }
                if (validMetadataColumns.includes('uploaded_at')) {
                    mappedData.uploaded_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    console.log(`Row ${i + 2}: Added uploaded_at metadata`);
                }

                const missingRequired = requiredColumns.filter(
                    col => !(col in mappedData) || mappedData[col] === null
                );
                if (missingRequired.length > 0) {
                    console.log(`Row ${i + 2}: Missing required columns: ${missingRequired.join(', ')}`);
                    failureData.push({
                        rowIndex: i + 2,
                        error: `Missing required columns: ${missingRequired.join(', ')}`,
                        unmatchedHeaders,
                        rawData: rowData
                    });
                    continue;
                }

                const columns = Object.keys(mappedData);
                const placeholders = columns.map(() => '?').join(', ');
                const columnNames = columns.map(col => `\`${col}\``).join(', ');
                const sql = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`;
                const values = Object.values(mappedData);

                console.log(`Inserting row ${i + 2}`);
                const [result] = await db.query(sql, values);
                if (result.affectedRows > 0) {
                    successData.push({
                        rowIndex: i + 2,
                        id: result.insertId
                    });
                } else {
                    failureData.push({
                        rowIndex: i + 2,
                        error: 'No rows affected',
                        unmatchedHeaders,
                        rawData: rowData
                    });
                }
                processedCount++;
            } catch (rowError) {
                console.error(`Error processing row ${i + 2}:`, rowError);
                failureData.push({
                    rowIndex: i + 2,
                    error: rowError.message,
                    unmatchedHeaders: [],
                    rawData: data[i]
                });
            }
        }

        console.log('Inserting file metadata into imported_file');
        const importStatus = failureData.length === 0 ? 'imported' : processedCount === 0 ? 'failed' : 'partial';
        try {
            if (!fileTypeToTable[type]) {
                console.error('Invalid type during imported_file insertion:', type);
                throw new Error('Invalid file type for imported_file insertion');
            }
            const importSql = `
                INSERT INTO imported_file (fichier_name, type, status, import_date)
                VALUES (?, ?, ?, NOW())
            `;
            const importValues = [fileName, type, importStatus];
            console.log('Executing imported_file insert:', { fileName, type, importStatus });
            const [importResult] = await db.query(importSql, importValues);
            console.log(`Inserted file metadata: ID ${importResult.insertId}`);
        } catch (importError) {
            console.error('Error inserting into imported_file:', importError);
            await db.query('ROLLBACK');
            return res.status(500).json({
                message: 'Failed to insert file metadata into imported_file',
                error: importError.message,
                code: importError.code,
                sql: importError.sql
            });
        }

        console.log('Building response');
        const response = {
            message: failureData.length === 0 ? 'File processing completed successfully' : 'File processing completed with errors',
            fileName,
            tableName,
            summary: {
                totalRows: data.length,
                processedRows: processedCount,
                successfulRows: successData.length,
                failedRows: failureData.length,
                successRate: processedCount > 0 ? ((successData.length / processedCount) * 100).toFixed(2) + '%' : '0%'
            },
            columnMapping: {
                total: Object.keys(columnMapping).length,
                valid: Object.keys(validColumnMapping).length,
                missing: missingColumns.length > 0 ? missingColumns : null,
                unmatchedHeaders: failureData.length > 0 ? failureData[0].unmatchedHeaders : []
            },
            data: {
                headers: Object.keys(data[0] || {}),
                failureDetails: failureData.slice(0, 10)
            }
        };

        const statusCode = failureData.length === 0 ? 200 : processedCount === 0 ? 400 : 207;
        console.log(`Sending response with status: ${statusCode}`);
        return res.status(statusCode).json(response);

    } catch (err) {
        console.error('Error in POST /uploads:', err);
        return res.status(500).json({
            message: 'Server error during file upload',
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
});

// GET route to list all imported files
router.get('/files', async (req, res) => {
    console.log('Starting GET /uploads/files');
    try {
        const [rows] = await db.query(`
            SELECT id, fichier_name, type, import_date, status
            FROM imported_file
            ORDER BY import_date DESC
        `);
        console.log(`Retrieved ${rows.length} imported files`);
        return res.status(200).json({
            message: 'Imported files retrieved successfully',
            files: rows
        });
    } catch (err) {
        console.error('GET /uploads/files error:', err);
        return res.status(500).json({
            message: 'Error retrieving imported files',
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
});

// POST route pour exporter stock_ewm vers Excel
router.post('/export/stock_ewm', async (req, res) => {
    console.log('Starting POST /uploads/export/stock_ewm');
    try {
        const [rows] = await db.query('SELECT * FROM stock_ewm');

        if (!rows || rows.length === 0) {
            console.log('No data found in stock_ewm');
            return res.status(404).json({ message: 'No data found in stock_ewm' });
        }

        const data = rows.map(row => ({
            Article: row.article,
            "Désignation Article": row.designation_article,
            "Numéro de Magasin": row.numero_magasin,
            Division: row.division,
            Magasin: row.magasin,
            Emplacement: row.emplacement,
            "Type de Magasin": row.type_magasin,
            Quantité: row.quantite,
            "Unité Qté de Base": row.unite_qte_base,
            "Type de Stock": row.type_stock,
            "Désign. type stock": row.designation_type_stock,
            "Groupe Valorisation": row.groupe_valorisation,
            Prix: row.prix,
            "Valeur de Stock": row.valeur_stock,
            Devise: row.devise,
            "Date EM": row.date_em ? new Date(row.date_em).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : null,
            "Dernière Sortie": row.derniere_sortie
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Stock_EWM');

        const fileName = `stock_ewm_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        console.log(`Exporting file: ${fileName}`);
        return res.status(200).send(buffer);

    } catch (err) {
        console.error('Error in POST /uploads/export/stock_ewm:', err);
        return res.status(500).json({
            message: 'Server error during export',
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
});

// Multer error handling
router.use((error, req, res, next) => {
    console.error('Multer error:', error);
    if (res.headersSent) {
        console.warn('Headers already sent in Multer handler, skipping response');
        return;
    }
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Only Excel files are allowed') {
        return res.status(400).json({ message: error.message });
    }
    return next(error);
});

// Global error handler
router.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    if (res.headersSent) {
        console.warn('Headers already sent in global handler, skipping response');
        return;
    }
    return res.status(500).json({
        message: 'Unexpected server error',
        error: err.message,
        code: err.code,
        sql: err.sql
    });
});

module.exports = router;