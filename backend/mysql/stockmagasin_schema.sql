-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: stockmagasin
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `controle_livraisons`
--

DROP TABLE IF EXISTS `controle_livraisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `controle_livraisons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `n_ot` varchar(50) DEFAULT NULL,
  `bs` varchar(50) DEFAULT NULL,
  `le` varchar(50) DEFAULT NULL,
  `commande_achat` varchar(50) DEFAULT NULL,
  `nature_sortie` varchar(100) NOT NULL,
  `type_sortie` varchar(10) NOT NULL,
  `n_reservation` varchar(50) DEFAULT NULL,
  `magasin` varchar(100) NOT NULL,
  `local` varchar(100) DEFAULT NULL,
  `demandeur` varchar(100) DEFAULT NULL,
  `preparateur` varchar(100) DEFAULT NULL,
  `responsable_local` varchar(100) DEFAULT NULL,
  `articles` longtext DEFAULT NULL,
  `date_livraison` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_n_ot_type` (`n_ot`,`type_sortie`),
  UNIQUE KEY `idx_bs_type` (`bs`,`type_sortie`),
  UNIQUE KEY `idx_le_type` (`le`,`type_sortie`),
  UNIQUE KEY `idx_commande_achat_type` (`commande_achat`,`type_sortie`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dimensions`
--

DROP TABLE IF EXISTS `dimensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dimensions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_article` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longueur` float NOT NULL,
  `largeur` float NOT NULL,
  `hauteur` float NOT NULL,
  `poids` float NOT NULL,
  `quantite` int(11) NOT NULL,
  `volume` float NOT NULL,
  `volume_quantite` float NOT NULL,
  `Type_Rayon` varchar(255) DEFAULT NULL,
  `manutention` varchar(100) DEFAULT NULL,
  `poids_global` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_article` (`id_article`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `imported_file`
--

DROP TABLE IF EXISTS `imported_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `imported_file` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fichier_name` varchar(255) NOT NULL,
  `import_date` datetime DEFAULT current_timestamp(),
  `type` enum('LE','LET','MB51','MVT','LST','LS','STOCK_EWM','STOCK_IAM') NOT NULL,
  `status` varchar(50) DEFAULT 'imported',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_fichier_name` (`fichier_name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `le_status`
--

DROP TABLE IF EXISTS `le_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `le_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bloque_global` varchar(50) DEFAULT NULL,
  `Document` int(11) DEFAULT NULL,
  `type_document` varchar(50) DEFAULT NULL,
  `description_type_document` text DEFAULT NULL,
  `genere_manuellement` tinyint(1) DEFAULT NULL,
  `vehicule` varchar(100) DEFAULT NULL,
  `unite_transport` varchar(100) DEFAULT NULL,
  `execution_logistique_livraison` varchar(100) DEFAULT NULL,
  `commande_achat` varchar(100) DEFAULT NULL,
  `numero_rma` varchar(100) DEFAULT NULL,
  `ordre_production` varchar(100) DEFAULT NULL,
  `avis_livraison` varchar(100) DEFAULT NULL,
  `statut_activite_magasin` varchar(100) DEFAULT NULL,
  `statut_transit` varchar(100) DEFAULT NULL,
  `statut_entree_stock` varchar(100) DEFAULT NULL,
  `statut_entree_stock_plan` varchar(100) DEFAULT NULL,
  `statut_entree_marchandises` varchar(100) DEFAULT NULL,
  `dechargement` varchar(100) DEFAULT NULL,
  `procedure_envoi` varchar(100) DEFAULT NULL,
  `lettre_voiture` varchar(100) DEFAULT NULL,
  `numero_pro` varchar(100) DEFAULT NULL,
  `document_fret` varchar(100) DEFAULT NULL,
  `transporteur` varchar(255) DEFAULT NULL,
  `porte_magasin` varchar(100) DEFAULT NULL,
  `point_dechargement` varchar(100) DEFAULT NULL,
  `exp_marchandises` varchar(255) DEFAULT NULL,
  `site_cedant` varchar(100) DEFAULT NULL,
  `receptionnaire_definitif_marchandises` varchar(255) DEFAULT NULL,
  `bureau_reception` varchar(100) DEFAULT NULL,
  `points_priorite` int(11) DEFAULT NULL,
  `nombre_postes` int(11) DEFAULT NULL,
  `nombre_unites_manutention` int(11) DEFAULT NULL,
  `nombre_produits` int(11) DEFAULT NULL,
  `date_livraison_planifiee` date DEFAULT NULL,
  `heure_livraison_planifiee` time DEFAULT NULL,
  `date_planifiee_entree_marchandises` date DEFAULT NULL,
  `heure_planifiee_entree_marchandises` time DEFAULT NULL,
  `date_livraison_sortante` date DEFAULT NULL,
  `heure_livraison_sortante` time DEFAULT NULL,
  `numero_operation_tcd` varchar(100) DEFAULT NULL,
  `type_planification_transport` varchar(100) DEFAULT NULL,
  `description_transport` varchar(255) DEFAULT NULL,
  `description_expediteur_marchandises` text DEFAULT NULL,
  `description_site_cedant` text DEFAULT NULL,
  `description_receptionnaire_final_marchandises` text DEFAULT NULL,
  `statut_sortie_entree_repartition` varchar(100) DEFAULT NULL,
  `statut_dechargement_repartition` varchar(100) DEFAULT NULL,
  `statut_dechargement_planifie_repartition` varchar(100) DEFAULT NULL,
  `statut_entree_stock_planifie_reparti` varchar(100) DEFAULT NULL,
  `statut_entree_stock_repartition` varchar(100) DEFAULT NULL,
  `refuse` varchar(100) DEFAULT NULL,
  `cree_le` date DEFAULT NULL,
  `cree_a` time DEFAULT NULL,
  `cree_par` varchar(100) DEFAULT NULL,
  `name_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_le_status_document` (`Document`)
) ENGINE=InnoDB AUTO_INCREMENT=505 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `le_tache`
--

DROP TABLE IF EXISTS `le_tache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `le_tache` (
  `Tache_magasin` varchar(255) DEFAULT NULL,
  `Produit` varchar(255) DEFAULT NULL,
  `Designation_produit` text DEFAULT NULL,
  `Qte_theo_ced_UQA` decimal(10,2) DEFAULT NULL,
  `Type_stock` varchar(50) DEFAULT NULL,
  `Emplacement_prenant` varchar(100) DEFAULT NULL,
  `Emplacement_cedant` varchar(100) DEFAULT NULL,
  `Document` int(11) DEFAULT NULL,
  `Date_creation` varchar(255) DEFAULT NULL,
  `Controle_qualite` varchar(50) DEFAULT NULL,
  `Poste_tache_magasin` varchar(100) DEFAULT NULL,
  `Tache_magasin_UM` varchar(100) DEFAULT NULL,
  `Type_processus_magasin` varchar(100) DEFAULT NULL,
  `Categ_processus_magasin` varchar(100) DEFAULT NULL,
  `Descr_categ_process_magasin` text DEFAULT NULL,
  `Activite` varchar(100) DEFAULT NULL,
  `Processus_stockage` varchar(100) DEFAULT NULL,
  `Etape_externe_du_processus` varchar(100) DEFAULT NULL,
  `Statut_tache_magasin` varchar(50) DEFAULT NULL,
  `Cree_par` varchar(100) DEFAULT NULL,
  `Heure_creation` varchar(255) DEFAULT NULL,
  `Confirme_par` varchar(100) DEFAULT NULL,
  `Date_confirmation` varchar(255) DEFAULT NULL,
  `Heure_confirmation` varchar(255) DEFAULT NULL,
  `Ressource_executante` varchar(100) DEFAULT NULL,
  `Motif_mouvement` varchar(100) DEFAULT NULL,
  `Code_exception` varchar(50) DEFAULT NULL,
  `Date_debut` varchar(255) DEFAULT NULL,
  `Heure_debut` varchar(255) DEFAULT NULL,
  `Lot` varchar(100) DEFAULT NULL,
  `Designation_type_stock` varchar(100) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `Commande_client_projet` varchar(100) DEFAULT NULL,
  `Poste_cde_client` varchar(100) DEFAULT NULL,
  `Categorie_document` varchar(100) DEFAULT NULL,
  `Utilisation` varchar(100) DEFAULT NULL,
  `Proprietaires` varchar(100) DEFAULT NULL,
  `Role_partenaire` varchar(100) DEFAULT NULL,
  `Personne_autorisee_a_disposer` varchar(100) DEFAULT NULL,
  `Qte_theo_ced_UQB` decimal(10,2) DEFAULT NULL,
  `Qte_reelle_pren_UQB` decimal(10,2) DEFAULT NULL,
  `Qte_ecart_UQB` decimal(10,2) DEFAULT NULL,
  `Unite_qte_base` varchar(50) DEFAULT NULL,
  `Qte_reelle_pren_UQA` decimal(10,2) DEFAULT NULL,
  `Qte_ecart_pren_UQA` decimal(10,2) DEFAULT NULL,
  `Ute_qte_altern` varchar(50) DEFAULT NULL,
  `Qte_reelle_pr_ds_UQ_PV` decimal(10,2) DEFAULT NULL,
  `Ute_qte_a_poids_var` varchar(50) DEFAULT NULL,
  `Evaluation_mesuree` varchar(100) DEFAULT NULL,
  `Quantite_ecart_ds_UQ_PV` decimal(10,2) DEFAULT NULL,
  `Statut_ecart_qte_PV_exacte` varchar(50) DEFAULT NULL,
  `Groupe_combinaisons` varchar(100) DEFAULT NULL,
  `Type_ute_manutention` varchar(100) DEFAULT NULL,
  `Evaluation_danger_1` varchar(100) DEFAULT NULL,
  `Evaluation_danger_2` varchar(100) DEFAULT NULL,
  `Poids_chargement` decimal(10,2) DEFAULT NULL,
  `Unite_poids` varchar(50) DEFAULT NULL,
  `Volume_chargement` decimal(10,2) DEFAULT NULL,
  `Unite_volume` varchar(50) DEFAULT NULL,
  `Consomm_capacite` decimal(10,2) DEFAULT NULL,
  `Charges_theor_TM` decimal(10,2) DEFAULT NULL,
  `Unite_temps` varchar(50) DEFAULT NULL,
  `Inventaire_entree_planifie` varchar(50) DEFAULT NULL,
  `Inventaire_entree` varchar(50) DEFAULT NULL,
  `Controle_stock_insuffisant_planifie` varchar(50) DEFAULT NULL,
  `Controle_stock_insuffisant` varchar(50) DEFAULT NULL,
  `Date_expiration_DLC` varchar(255) DEFAULT NULL,
  `Date_entree_marchandises` varchar(255) DEFAULT NULL,
  `Temps_reception` varchar(255) DEFAULT NULL,
  `Pays_origine` varchar(100) DEFAULT NULL,
  `Matiere_dangereuse_stockage` varchar(50) DEFAULT NULL,
  `Type_inspection` varchar(100) DEFAULT NULL,
  `Cible_identif_stock` varchar(100) DEFAULT NULL,
  `Type_magasin_cedant` varchar(100) DEFAULT NULL,
  `Aire_stock_cedante` varchar(100) DEFAULT NULL,
  `Poste_cedant_log_UM` varchar(100) DEFAULT NULL,
  `Ressource_cedante` varchar(100) DEFAULT NULL,
  `Ute_trnsp_ced_int` varchar(100) DEFAULT NULL,
  `Unite_transport_cedante` varchar(100) DEFAULT NULL,
  `Transporteur_cedant` varchar(100) DEFAULT NULL,
  `Cat_site_cedante` varchar(100) DEFAULT NULL,
  `Unite_manut_cedante` varchar(100) DEFAULT NULL,
  `Quantite_a_conserver` decimal(10,2) DEFAULT NULL,
  `Type_magasin_prenant` varchar(100) DEFAULT NULL,
  `Aire_stockage_prenant` varchar(100) DEFAULT NULL,
  `Poste_prenant_logique_UM` varchar(100) DEFAULT NULL,
  `Position_equipement_distribution_TM` varchar(100) DEFAULT NULL,
  `Ressource_prenante` varchar(100) DEFAULT NULL,
  `Ute_trsp_pren_int` varchar(100) DEFAULT NULL,
  `Unite_transport_prenante` varchar(100) DEFAULT NULL,
  `Transporteur_prenant` varchar(100) DEFAULT NULL,
  `Categorie_site_prenant` varchar(100) DEFAULT NULL,
  `Unite_manut_prenante` varchar(100) DEFAULT NULL,
  `Empl_pren_orig` varchar(100) DEFAULT NULL,
  `Prelevement_UM_complet` varchar(50) DEFAULT NULL,
  `TM_sous_systeme` varchar(100) DEFAULT NULL,
  `Prelever_stock_total_emplacement` varchar(50) DEFAULT NULL,
  `name_file` varchar(255) DEFAULT NULL,
  `uploaded_at` varchar(255) DEFAULT NULL,
  KEY `idx_fichier_name` (`name_file`),
  KEY `idx_document` (`Document`),
  KEY `idx_production` (`Produit`),
  KEY `idx_lt_produit` (`Produit`),
  KEY `idx_lt_document` (`Document`),
  KEY `idx_le_tache_produit` (`Produit`),
  KEY `idx_le_tache_document` (`Document`),
  KEY `idx_lee_tache_produit` (`Produit`,`Emplacement_prenant`(50)),
  KEY `idx_produit` (`Produit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `stockmagasin` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_le_tache_delete
AFTER DELETE ON le_tache
FOR EACH ROW
BEGIN
    DELETE FROM dimensions
    WHERE id_article = OLD.Produit;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `stockmagasin` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;

--
-- Table structure for table `ls_status`
--

DROP TABLE IF EXISTS `ls_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ls_status` (
  `name_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Document` int(11) DEFAULT NULL,
  `type_document` varchar(50) DEFAULT NULL,
  `description_type_document` text DEFAULT NULL,
  `genere_manuellement` tinyint(1) DEFAULT NULL,
  `vehicule` varchar(100) DEFAULT NULL,
  `unite_transport` varchar(100) DEFAULT NULL,
  `transporteur` varchar(100) DEFAULT NULL,
  `bureau_expedition` varchar(50) DEFAULT NULL,
  `recept_march` varchar(100) DEFAULT NULL,
  `site_prenant` varchar(100) DEFAULT NULL,
  `receptionnaire_definitif_marchandises` varchar(100) DEFAULT NULL,
  `nombre_postes` int(11) DEFAULT NULL,
  `nombre_unites_manutention` int(11) DEFAULT NULL,
  `nombre_produits` int(11) DEFAULT NULL,
  `itineraire` varchar(100) DEFAULT NULL,
  `calendrier_depart_tournee` varchar(100) DEFAULT NULL,
  `origine_donnees_base_itin` varchar(100) DEFAULT NULL,
  `date_depart_itineraire_planifiee` varchar(50) DEFAULT NULL,
  `heure_depart_itineraire_planifiee` varchar(50) DEFAULT NULL,
  `appartenance_vague_prelevement` varchar(50) DEFAULT NULL,
  `porte_magasin` varchar(50) DEFAULT NULL,
  `statut_activite_magasin` varchar(50) DEFAULT NULL,
  `statut_prelevement` varchar(50) DEFAULT NULL,
  `statut_prelevement_plan` varchar(50) DEFAULT NULL,
  `statut_emballage` varchar(50) DEFAULT NULL,
  `charger` varchar(50) DEFAULT NULL,
  `statut_sortie_marchandises` varchar(50) DEFAULT NULL,
  `statut_determination_itineraire` varchar(50) DEFAULT NULL,
  `procedure_envoi` varchar(100) DEFAULT NULL,
  `termine` varchar(50) DEFAULT NULL,
  `commande_client` varchar(100) DEFAULT NULL,
  `numero_rma` varchar(100) DEFAULT NULL,
  `commande_achat` varchar(100) DEFAULT NULL,
  `ordre_production` varchar(100) DEFAULT NULL,
  `execution_logistique_livraison` varchar(100) DEFAULT NULL,
  `document_origine_erp` varchar(100) DEFAULT NULL,
  `commande_achat_repartition_marchandise` varchar(100) DEFAULT NULL,
  `lettre_de_voiture` varchar(100) DEFAULT NULL,
  `numero_operation_tcd` varchar(100) DEFAULT NULL,
  `document_fret` varchar(100) DEFAULT NULL,
  `date_livraison_planifiee` varchar(50) DEFAULT NULL,
  `heure_livraison_planifiee` varchar(50) DEFAULT NULL,
  `date_livraison_definitive` varchar(50) DEFAULT NULL,
  `heure_livraison_definitive` varchar(50) DEFAULT NULL,
  `type_planification_transport` varchar(50) DEFAULT NULL,
  `description_transporteur` text DEFAULT NULL,
  `description_receptionnaire_marchandises` text DEFAULT NULL,
  `description_site_prenant` text DEFAULT NULL,
  `description_receptionnaire_final_marchandises` text DEFAULT NULL,
  `statut_prelevement_repartition_plan` varchar(50) DEFAULT NULL,
  `statut_prelevement_et_repartition` varchar(50) DEFAULT NULL,
  `statut_emballage_pret_envoi_repartition` varchar(50) DEFAULT NULL,
  `statut_mise_disposition_repartition` varchar(50) DEFAULT NULL,
  `statut_chargement_et_repartition` varchar(50) DEFAULT NULL,
  `statut_sortie_marchandises_repartition` varchar(50) DEFAULT NULL,
  `cree_le` varchar(50) DEFAULT NULL,
  `cree_a` varchar(50) DEFAULT NULL,
  `numero_sequence` int(11) DEFAULT NULL,
  `pertinence_marchandises_dangereuses` varchar(50) DEFAULT NULL,
  `cree_par` varchar(100) DEFAULT NULL,
  `bloque_global` tinyint(1) DEFAULT NULL,
  `uploaded_at` varchar(255) DEFAULT NULL,
  KEY `idx_lss_document` (`Document`),
  KEY `idx_ls_status_document` (`Document`,`site_prenant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ls_tache`
--

DROP TABLE IF EXISTS `ls_tache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ls_tache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_file` varchar(255) NOT NULL,
  `Produit` int(11) DEFAULT NULL,
  `Designation_produit` text DEFAULT NULL,
  `Qte_reelle_pren_UQB` decimal(10,2) DEFAULT NULL,
  `Document` int(11) DEFAULT NULL,
  `Tache_magasin` text DEFAULT NULL,
  `Aire_activite` varchar(20) DEFAULT NULL,
  `Poste_tache_magasin` varchar(20) DEFAULT NULL,
  `Type_processus_magasin` varchar(20) DEFAULT NULL,
  `Categ_processus_magasin` varchar(20) DEFAULT NULL,
  `Descr_categ_process_magasin` text DEFAULT NULL,
  `Activite` varchar(20) DEFAULT NULL,
  `Emplacement_cedant` text DEFAULT NULL,
  `Aire_stockage_prenant` varchar(20) DEFAULT NULL,
  `Type_magasin_prenant` varchar(20) DEFAULT NULL,
  `Emplacement_prenant` text DEFAULT NULL,
  `Statut_tache_magasin` varchar(20) DEFAULT NULL,
  `Cree_par` text DEFAULT NULL,
  `Date_creation` date DEFAULT NULL,
  `Heure_creation` time DEFAULT NULL,
  `Confirme_par` text DEFAULT NULL,
  `Date_confirmation` date DEFAULT NULL,
  `Heure_confirmation` time DEFAULT NULL,
  `Date_debut` date DEFAULT NULL,
  `Heure_debut` time DEFAULT NULL,
  `Lot` text DEFAULT NULL,
  `Type_stock` varchar(20) DEFAULT NULL,
  `Designation_type_stock` text DEFAULT NULL,
  `Type` varchar(20) DEFAULT NULL,
  `Commande_client_projet` text DEFAULT NULL,
  `Poste_cde_client` varchar(20) DEFAULT NULL,
  `Categorie_document` text DEFAULT NULL,
  `Utilisation` text DEFAULT NULL,
  `Proprietaires` text DEFAULT NULL,
  `Role_partenaire` text DEFAULT NULL,
  `Personne_autorisee_a_disposer` text DEFAULT NULL,
  `Qte_theor_ced_UQB` decimal(10,2) DEFAULT NULL,
  `Qte_ecart_UQB` decimal(10,2) DEFAULT NULL,
  `Unite_qte_base` varchar(20) DEFAULT NULL,
  `Qte_theo_ced_UQA` decimal(10,2) DEFAULT NULL,
  `Qte_reelle_pren_UQA` decimal(10,2) DEFAULT NULL,
  `Qte_ecart_pren_UQA` decimal(10,2) DEFAULT NULL,
  `Ute_qte_altern` varchar(20) DEFAULT NULL,
  `Qte_reelle_pr_ds_UQ_PV` decimal(10,2) DEFAULT NULL,
  `Ute_qte_a_poids_var` varchar(20) DEFAULT NULL,
  `Evaluation_mesuree` decimal(10,2) DEFAULT NULL,
  `Quantite_ecart_ds_UQ_PV` decimal(10,2) DEFAULT NULL,
  `Statut_ecart_qte_PV_exacte` varchar(20) DEFAULT NULL,
  `Type_ute_manutention` varchar(20) DEFAULT NULL,
  `Evaluation_danger_1` varchar(20) DEFAULT NULL,
  `Evaluation_danger_2` varchar(20) DEFAULT NULL,
  `Poids_chargement` decimal(10,2) DEFAULT NULL,
  `Unite_poids` varchar(20) DEFAULT NULL,
  `Volume_chargement` decimal(10,2) DEFAULT NULL,
  `Unite_volume` varchar(20) DEFAULT NULL,
  `Consomm_capacite` decimal(10,2) DEFAULT NULL,
  `Charges_theor_TM` decimal(10,2) DEFAULT NULL,
  `Unite_temps` varchar(20) DEFAULT NULL,
  `Inventaire_entree_planifie` tinyint(1) DEFAULT NULL,
  `Inventaire_entree` tinyint(1) DEFAULT NULL,
  `Controle_stock_insuffisant_planifie` tinyint(1) DEFAULT NULL,
  `Controle_stock_insuffisant` tinyint(1) DEFAULT NULL,
  `Date_expiration_DLC` date DEFAULT NULL,
  `Date_entree_marchandises` date DEFAULT NULL,
  `Temps_reception` time DEFAULT NULL,
  `Pays_origine` varchar(20) DEFAULT NULL,
  `Matiere_dangereuse_stockage` varchar(20) DEFAULT NULL,
  `Type_inspection` varchar(20) DEFAULT NULL,
  `Controle_qualite` tinyint(1) DEFAULT NULL,
  `Cible_identif_stock` text DEFAULT NULL,
  `Type_magasin_cedant` varchar(20) DEFAULT NULL,
  `Aire_stock_cedante` varchar(20) DEFAULT NULL,
  `Ressource_cedante` text DEFAULT NULL,
  `Ute_trnsp_ced_int` varchar(20) DEFAULT NULL,
  `Unite_transport_cedante` text DEFAULT NULL,
  `Transporteur_cedant` text DEFAULT NULL,
  `Cat_site_cedante` varchar(20) DEFAULT NULL,
  `Unite_manut_cedante` varchar(20) DEFAULT NULL,
  `Quantite_a_conserver` decimal(10,2) DEFAULT NULL,
  `Ressource_prenante` text DEFAULT NULL,
  `Ute_trsp_pren_int` varchar(20) DEFAULT NULL,
  `Unite_transport_prenante` text DEFAULT NULL,
  `Transporteur_prenant` text DEFAULT NULL,
  `Categorie_site_prenant` varchar(20) DEFAULT NULL,
  `Ordre_magasin` text DEFAULT NULL,
  `Groupe_combinaisons` varchar(20) DEFAULT NULL,
  `Poste_cedant_log_UM` varchar(20) DEFAULT NULL,
  `Poste_prenant_logique_UM` varchar(20) DEFAULT NULL,
  `Position_equipement_distribution_TM` varchar(20) DEFAULT NULL,
  `Unite_manut_prenante` varchar(20) DEFAULT NULL,
  `Empl_pren_orig` text DEFAULT NULL,
  `Prelevement_UM_complet` tinyint(1) DEFAULT NULL,
  `TM_sous_systeme` varchar(20) DEFAULT NULL,
  `Prelever_stock_total_emplacement` tinyint(1) DEFAULT NULL,
  `Cat_doc_ref_docmt` varchar(20) DEFAULT NULL,
  `Poste_document` varchar(20) DEFAULT NULL,
  `Demande_comptage` tinyint(1) DEFAULT NULL,
  `Vague` varchar(20) DEFAULT NULL,
  `Poste_vague` varchar(20) DEFAULT NULL,
  `Type_tache_magasin` varchar(20) DEFAULT NULL,
  `Prel_en_deux_etapes` tinyint(1) DEFAULT NULL,
  `Categorie_doc_stock` varchar(20) DEFAULT NULL,
  `Reference_stock` text DEFAULT NULL,
  `Poste_reference_stock` varchar(20) DEFAULT NULL,
  `Identif_stock` text DEFAULT NULL,
  `Date_cloture_planifiee` date DEFAULT NULL,
  `Heure_cloture_planifiee` time DEFAULT NULL,
  `Document_annule` tinyint(1) DEFAULT NULL,
  `Aire_activites_OM` varchar(20) DEFAULT NULL,
  `Regle_creation_ordre_magasin` varchar(20) DEFAULT NULL,
  `Sequence_tri` int(11) DEFAULT NULL,
  `File_attente` varchar(20) DEFAULT NULL,
  `Groupe_types_UM` varchar(20) DEFAULT NULL,
  `Categorie_vague` varchar(20) DEFAULT NULL,
  `Itineraire` text DEFAULT NULL,
  `Groupe_groupage` varchar(20) DEFAULT NULL,
  `Sequence` int(11) DEFAULT NULL,
  `Numero_journal` varchar(20) DEFAULT NULL,
  `Aire_stockage_production` varchar(20) DEFAULT NULL,
  `Ordre_production` text DEFAULT NULL,
  `ID_kanban` varchar(20) DEFAULT NULL,
  `Numero_certificat` varchar(20) DEFAULT NULL,
  `Priorite` int(11) DEFAULT NULL,
  `Document_article` text DEFAULT NULL,
  `Ex_doc_article` varchar(4) DEFAULT NULL,
  `Poste_doc_article` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lts_produit` (`Produit`),
  KEY `idx_lts_document` (`Document`),
  KEY `idx_ls_tache_produit` (`Produit`,`Emplacement_prenant`(50)),
  KEY `idx_lss_tache_produit` (`Produit`,`Emplacement_prenant`(50)),
  KEY `idx_produit` (`Produit`)
) ENGINE=InnoDB AUTO_INCREMENT=5632 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mb51`
--

DROP TABLE IF EXISTS `mb51`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mb51` (
  `reference` varchar(100) DEFAULT NULL,
  `document_article` varchar(100) DEFAULT NULL,
  `date_comptable` varchar(50) DEFAULT NULL,
  `article` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `division` varchar(50) DEFAULT NULL,
  `designation_article` varchar(255) DEFAULT NULL,
  `code_mouvement` varchar(50) DEFAULT NULL,
  `qte_en_unite_saisie` varchar(50) DEFAULT NULL,
  `ordre` varchar(100) DEFAULT NULL,
  `uq_de_saisie` varchar(50) DEFAULT NULL,
  `montant_di` varchar(50) DEFAULT NULL,
  `date_de_saisie` varchar(50) DEFAULT NULL,
  `heure_de_saisie` varchar(50) DEFAULT NULL,
  `nom_de_l_utilisateur` varchar(100) DEFAULT NULL,
  `commande_achat` varchar(100) DEFAULT NULL,
  `quantite` decimal(10,2) DEFAULT NULL,
  `lot` varchar(100) DEFAULT NULL,
  `magasin` varchar(100) DEFAULT NULL,
  `nom_1` varchar(100) DEFAULT NULL,
  `texte_code_mouvement` varchar(100) DEFAULT NULL,
  `stock_special` varchar(100) DEFAULT NULL,
  `exercice_doc_article` varchar(50) DEFAULT NULL,
  `poste_doc_article` varchar(50) DEFAULT NULL,
  `societe` varchar(50) DEFAULT NULL,
  `bon_daccompagnement` varchar(100) DEFAULT NULL,
  `centre_de_couts` varchar(100) DEFAULT NULL,
  `client` varchar(100) DEFAULT NULL,
  `code_debit_credit` varchar(10) DEFAULT NULL,
  `code_entree_magasin` varchar(50) DEFAULT NULL,
  `code_origine_mouvement` varchar(50) DEFAULT NULL,
  `commande_client` varchar(100) DEFAULT NULL,
  `commande_client_2` varchar(100) DEFAULT NULL,
  `compteur` varchar(50) DEFAULT NULL,
  `consommation` varchar(100) DEFAULT NULL,
  `date_document` varchar(50) DEFAULT NULL,
  `devise` varchar(10) DEFAULT NULL,
  `echeance_cde_client` varchar(50) DEFAULT NULL,
  `element_d_otp` varchar(100) DEFAULT NULL,
  `groupe_valorisation` varchar(100) DEFAULT NULL,
  `immobilisation` varchar(10) DEFAULT NULL,
  `imputation_multiple` varchar(10) DEFAULT NULL,
  `montant_saisi_utilisateur_di` varchar(50) DEFAULT NULL,
  `motif_mouvement` varchar(100) DEFAULT NULL,
  `poste_reservation_transfert` varchar(100) DEFAULT NULL,
  `doc_configurable` varchar(100) DEFAULT NULL,
  `num_gamme_operations` varchar(100) DEFAULT NULL,
  `numero_subsidiaire` varchar(100) DEFAULT NULL,
  `operation` varchar(100) DEFAULT NULL,
  `poste` varchar(100) DEFAULT NULL,
  `poste_cde_client` varchar(100) DEFAULT NULL,
  `poste_cde_client_2` varchar(100) DEFAULT NULL,
  `poste_origine` varchar(100) DEFAULT NULL,
  `poste_genere_auto` varchar(100) DEFAULT NULL,
  `qte_en_unite_achat` varchar(50) DEFAULT NULL,
  `qte_unite_prx` varchar(50) DEFAULT NULL,
  `reseau` varchar(100) DEFAULT NULL,
  `reservation` varchar(100) DEFAULT NULL,
  `segment_stock` varchar(100) DEFAULT NULL,
  `texte_entete_document` text DEFAULT NULL,
  `type_d_operation` varchar(100) DEFAULT NULL,
  `unite_achat` varchar(50) DEFAULT NULL,
  `unite_de_prix` varchar(50) DEFAULT NULL,
  `unite_de_qte_base` varchar(50) DEFAULT NULL,
  `valeur_au_pv_tva` varchar(50) DEFAULT NULL,
  `valeur_vente` varchar(50) DEFAULT NULL,
  `fournisseur` varchar(100) DEFAULT NULL,
  `name_file` varchar(255) DEFAULT NULL,
  `uploaded_at` varchar(50) DEFAULT NULL,
  KEY `idx_reference` (`reference`,`article`),
  KEY `idx_mb51_article` (`article`,`designation_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migration`
--

DROP TABLE IF EXISTS `migration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migration` (
  `Marque` bigint(20) DEFAULT NULL,
  `Oracle_item_code` double DEFAULT NULL,
  `DESCRIPTION` text DEFAULT NULL,
  `Qté_validée_SAP` double DEFAULT NULL,
  `SAP_Material` varchar(255) DEFAULT NULL,
  `PLANT` text DEFAULT NULL,
  `Plant_Validé` text DEFAULT NULL,
  `Storage_Location` text DEFAULT NULL,
  `Storage_location_Validé` text DEFAULT NULL,
  `local` text DEFAULT NULL,
  `BIN_SAP` text DEFAULT NULL,
  `Nombre_de_bin_NX` double DEFAULT NULL,
  `QTE_NX` double DEFAULT NULL,
  `bin` text DEFAULT NULL,
  KEY `idx_migration_sap_material` (`SAP_Material`),
  KEY `idx_migration_marque` (`Marque`),
  KEY `idx_migration_description` (`DESCRIPTION`(768)),
  KEY `idx_sap_material` (`SAP_Material`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_ewm`
--

DROP TABLE IF EXISTS `stock_ewm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_ewm` (
  `name_file` varchar(255) DEFAULT NULL,
  `article` varchar(255) DEFAULT NULL,
  `designation_article` varchar(255) DEFAULT NULL,
  `numero_magasin` varchar(50) DEFAULT NULL,
  `division` varchar(50) DEFAULT NULL,
  `magasin` varchar(50) DEFAULT NULL,
  `emplacement` varchar(100) DEFAULT NULL,
  `type_magasin` varchar(50) DEFAULT NULL,
  `quantite` decimal(10,3) DEFAULT NULL,
  `unite_qte_base` varchar(20) DEFAULT NULL,
  `type_stock` varchar(50) DEFAULT NULL,
  `designation_type_stock` varchar(50) DEFAULT NULL,
  `groupe_valorisation` varchar(50) DEFAULT NULL,
  `prix` decimal(10,2) DEFAULT NULL,
  `valeur_stock` decimal(12,3) DEFAULT NULL,
  `devise` varchar(10) DEFAULT NULL,
  `date_em` date DEFAULT NULL,
  `derniere_sortie` varchar(20) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  KEY `idx_article` (`article`),
  KEY `idx_stock_article` (`article`),
  KEY `idx_division_article` (`division`,`article`),
  KEY `idx_type_stock_article` (`type_stock`,`article`),
  KEY `idx_stock_ewm_article` (`article`),
  KEY `idx_stock_ewm_designation` (`designation_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_iam`
--

DROP TABLE IF EXISTS `stock_iam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_iam` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_article` varchar(255) DEFAULT NULL,
  `description_article` varchar(255) DEFAULT NULL,
  `division` varchar(50) DEFAULT NULL,
  `nom_division` varchar(255) DEFAULT NULL,
  `magasin` varchar(50) DEFAULT NULL,
  `description_magasin` varchar(255) DEFAULT NULL,
  `type_stock_special` varchar(50) DEFAULT NULL,
  `stock_utilisation_libre` decimal(10,3) DEFAULT NULL,
  `stock_controle_qualite` decimal(10,3) DEFAULT NULL,
  `stock_bloque` decimal(10,3) DEFAULT NULL,
  `date_reporting` date DEFAULT NULL,
  `valeur_stock_utilisation_libre` decimal(12,3) DEFAULT NULL,
  `valeur_stock_bloque` decimal(12,3) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_stock_iam_numero_article` (`numero_article`)
) ENGINE=InnoDB AUTO_INCREMENT=30998 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_stock_aggregation`
--

DROP TABLE IF EXISTS `temp_stock_aggregation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_stock_aggregation` (
  `article_code` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `final_location` varchar(255) DEFAULT NULL,
  `quantity_ewm` decimal(15,3) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`article_code`),
  KEY `idx_article_code` (`article_code`),
  KEY `idx_description` (`description`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `language` varchar(50) DEFAULT 'English',
  `timezone` varchar(50) DEFAULT 'UTC',
  `sync_data` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-26 16:10:15
