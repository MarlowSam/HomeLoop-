-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: homeloop
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `status` enum('success','failed') DEFAULT 'success',
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `agent_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `licence_number` varchar(100) NOT NULL,
  `agency_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `bio` text,
  `years_experience` int DEFAULT NULL,
  `areas_of_operation` varchar(500) DEFAULT NULL,
  `specializations` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_documents` text,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`agent_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `licence_number` (`licence_number`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_licence` (`licence_number`),
  KEY `idx_verified` (`is_verified`),
  CONSTRAINT `agents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
INSERT INTO `agents` VALUES (1,2,'John Doe','LIC123456','Prime Properties Kenya','+254700000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,0.00,0,'2025-10-11 18:29:55','2025-10-11 18:29:55'),(7,9,'John Doe','LIC999888','Prime Properties Kenya','+254700000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-11 19:24:09','2025-10-11 19:24:09'),(9,11,'John Doe','LIC12346','Prim Properties Kenya','+254700000001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-12 08:24:54','2025-10-12 08:24:54'),(10,12,'Homeloop','LC11','Sammy PLC','0114151187',NULL,NULL,NULL,NULL,'/uploads/profiles/agent_1770663454839.PNG','',0,NULL,NULL,0,NULL,0.00,0,'2025-10-12 08:27:59','2026-02-09 18:57:34'),(11,15,'Kamau','l2c11','Enter','0792508999',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-12 19:58:10','2025-10-12 19:58:10'),(12,18,'Kamau','d3c11','Test','0798543456',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-12 20:12:39','2025-10-12 20:12:39'),(13,19,'Sammy','h111','How','0114151186',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-12 20:17:11','2025-10-12 20:17:11'),(14,20,'Sammy','N311','Enter Today','01141511866',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 07:12:54','2025-10-13 07:12:54'),(15,21,'Skill','Skill','How Now','0780900900',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 07:16:53','2025-10-13 07:16:53'),(18,24,'MARLOW','N3112','Enter Skills','011211311',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 07:36:34','2025-10-13 07:36:34'),(19,25,'Azezah','Leo','James','0700000011',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 07:40:03','2025-10-13 07:40:03'),(20,26,'Enter','j777','Edith','0755544411',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 18:12:20','2025-10-13 18:12:20'),(21,27,'you','are55','Serious','0756433211',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 18:17:26','2025-10-13 18:17:26'),(22,29,'Today','ht1111','Trend','077777712',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 18:22:33','2025-10-13 18:22:33'),(23,30,'Full','Name','Agent','0888822225',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 18:28:52','2025-10-13 18:28:52'),(24,31,'Kamauu','d3c12','Jamey','0114151187',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 19:00:47','2025-10-13 19:00:47'),(25,32,'Entere','h1112','Howw','0114151186',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 19:05:43','2025-10-13 19:05:43'),(26,33,'Azeza','l2c34','Sammy PLd','0792508956',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-13 19:37:45','2025-10-13 19:37:45'),(27,34,'Name','Number','Howee','0114151167',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-15 17:48:33','2025-10-15 17:48:33'),(28,35,'Kamae','LC1154f','Tester','01141511867',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-15 19:07:13','2025-10-15 19:07:13'),(29,36,'Sammyi','N3123','Enteres','0114151189',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-16 07:10:50','2025-10-16 07:10:50'),(30,37,'Agent Test','LC001','Test Realty','0712345678',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-16 08:16:39','2025-10-16 08:16:39'),(32,39,'Agent Tester','LC0013w','Tester Realty','0712345645',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-16 08:21:41','2025-10-16 08:21:41'),(33,40,'Kamref','N3we3','Howres','011415123',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2025-10-18 07:26:41','2025-10-18 07:26:41'),(34,41,'Homeloop','N313','HomeLoop LTD','0792508998',NULL,NULL,NULL,NULL,'/uploads/profiles/agent_1768031110821.PNG','',0,NULL,NULL,0,NULL,0.00,0,'2025-10-21 15:36:01','2026-01-10 07:45:10'),(35,54,'Great Properties LTD','KSG23D','Great Properties LTD','0792508999',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2026-02-19 13:12:29','2026-02-19 13:12:29'),(37,56,'Sammy Nderi','khsd3311','Great Properties LTD','O792508999',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0.00,0,'2026-02-19 13:18:03','2026-02-19 13:18:03');
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `user_id` int NOT NULL,
  `agent_id` int NOT NULL,
  `appointment_date` datetime NOT NULL,
  `appointment_type` enum('viewing','consultation','inspection') DEFAULT 'viewing',
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `notes` text,
  `cancellation_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_date` (`appointment_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `preferred_date` date NOT NULL,
  `preferred_time` time NOT NULL,
  `notes` text,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at` DESC),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,10,41,'Sammy','kamausammy161@gmail.com','0114151187','2025-11-05','09:00:00','I will be accompanied by my husband dont be late please','pending','2025-11-05 09:11:00','2025-11-05 09:11:00'),(2,10,41,'John','saisiduncan99@gmail.com','0792508998','2025-11-06','10:10:00','no additional  notes','confirmed','2025-11-05 09:12:38','2025-12-06 19:05:07'),(3,10,41,'Azezah','kamausammy161@gmail.com','0742734465','2025-11-05','18:14:00','No additional notes','confirmed','2025-11-05 15:14:40','2025-12-06 18:59:55'),(4,11,12,'Enter','saisiduncan99@gmail.com','0792508998','2025-11-05','19:20:00','No additional information','confirmed','2025-11-05 16:21:15','2025-12-21 18:50:31'),(5,12,12,'Homeloop','Marlowgood2025@gmail.com','+254 792508999','2025-11-07','10:00:00',NULL,'confirmed','2025-11-05 17:34:40','2026-02-19 13:26:04'),(7,12,12,'new','new@gmail.com','0742734465','2025-11-07','17:05:00',NULL,'confirmed','2025-11-06 07:40:03','2025-12-06 18:43:15'),(8,20,41,'Sammy','kamausammy161@gmail.com','0792508998','2025-11-20','18:06:00',NULL,'confirmed','2025-11-20 15:06:20','2026-01-10 07:00:43'),(9,39,12,'Sammy Homes','nderisammy30@gmail.com','0114151187','2026-01-10','10:01:00',NULL,'confirmed','2026-01-10 07:01:38','2026-02-19 13:25:14'),(10,39,12,'Sammy Homes','kamausammy161@gmail.com','0114151187','2026-01-11','13:10:00',NULL,'confirmed','2026-01-10 07:04:33','2026-02-19 13:21:00');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bundles`
--

DROP TABLE IF EXISTS `bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bundles` (
  `bundle_id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int NOT NULL,
  `viewing_fee` decimal(10,2) NOT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`bundle_id`),
  KEY `idx_agent_bundles` (`agent_id`),
  KEY `idx_featured_bundles` (`is_featured`,`created_at`),
  CONSTRAINT `bundles_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bundles`
--

LOCK TABLES `bundles` WRITE;
/*!40000 ALTER TABLE `bundles` DISABLE KEYS */;
INSERT INTO `bundles` VALUES (1,12,40000.00,0,'2026-01-29 19:38:47','2026-01-29 19:38:47'),(2,12,1500.00,0,'2026-02-06 13:41:54','2026-02-06 13:41:54'),(3,41,1200.00,0,'2026-02-10 07:30:34','2026-02-10 07:30:34'),(4,12,1500.00,0,'2026-02-15 13:13:21','2026-02-15 13:13:21');
/*!40000 ALTER TABLE `bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `conversation_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `buyer_id` int NOT NULL COMMENT 'references users.user_id where role=user',
  `agent_id` int NOT NULL COMMENT 'references users.user_id where role=agent',
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_message_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  UNIQUE KEY `unique_conversation` (`property_id`,`buyer_id`,`agent_id`),
  KEY `idx_buyer` (`buyer_id`),
  KEY `idx_agent` (`agent_id`),
  KEY `idx_property` (`property_id`),
  KEY `idx_last_message` (`last_message_at` DESC),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,19,44,41,'active','2025-11-19 11:59:49','2025-11-21 19:26:12'),(2,20,44,41,'active','2025-11-19 18:11:26','2025-12-06 06:57:42'),(3,14,44,41,'active','2025-11-20 14:59:09','2025-11-20 14:59:09'),(4,13,44,41,'active','2025-11-20 21:11:36','2025-11-20 21:25:12'),(5,12,44,12,'active','2025-11-21 08:39:15','2025-11-21 08:39:15'),(6,16,44,41,'active','2025-11-21 19:18:51','2025-11-21 19:20:28'),(7,18,44,41,'active','2025-11-22 18:40:03','2025-11-23 08:41:06'),(8,20,41,41,'active','2025-11-22 18:45:39','2025-11-22 18:45:39'),(9,21,44,41,'active','2025-11-22 19:10:24','2025-11-22 19:10:24'),(10,23,44,12,'active','2025-11-24 16:20:27','2025-12-06 09:37:36'),(11,25,44,12,'active','2025-11-26 08:59:54','2025-11-28 08:00:27'),(12,26,44,12,'active','2025-11-27 09:20:50','2025-11-27 19:50:52'),(13,26,17,12,'active','2025-11-27 09:33:34','2025-11-27 19:48:08'),(14,25,17,12,'active','2025-11-27 09:35:47','2025-11-28 08:28:41'),(15,29,44,12,'active','2025-11-30 15:31:43','2025-11-30 15:31:43'),(16,29,12,12,'active','2025-12-01 13:14:44','2025-12-01 13:14:44'),(17,30,44,41,'active','2025-12-06 07:54:46','2025-12-06 18:47:25'),(18,22,44,12,'active','2025-12-06 15:59:51','2025-12-06 16:01:10'),(19,36,44,41,'active','2025-12-07 14:10:01','2025-12-07 14:12:48'),(21,34,44,41,'active','2025-12-07 15:57:53','2025-12-07 15:58:35'),(22,38,44,41,'active','2026-01-09 15:40:40','2026-01-09 16:28:57'),(23,39,44,12,'active','2026-01-28 15:54:09','2026-01-28 15:54:09'),(24,1,44,12,'active','2026-01-30 08:11:18','2026-01-30 08:11:23'),(25,41,44,12,'active','2026-01-30 08:11:18','2026-02-17 12:56:39'),(26,40,44,12,'active','2026-01-30 08:15:32','2026-02-07 19:18:16'),(27,43,44,12,'active','2026-01-30 08:20:46','2026-01-30 08:20:46'),(28,2,44,12,'active','2026-02-07 19:15:10','2026-02-07 19:15:10'),(29,46,44,12,'active','2026-02-07 19:15:10','2026-02-08 12:23:11'),(30,45,44,12,'active','2026-02-07 19:16:56','2026-02-15 19:16:18'),(31,44,44,12,'active','2026-02-07 19:25:50','2026-02-14 14:04:53'),(32,51,52,12,'active','2026-02-17 12:59:53','2026-02-17 12:59:57'),(33,51,53,12,'active','2026-02-17 13:01:50','2026-02-17 13:02:04'),(34,51,44,12,'active','2026-02-17 13:02:27','2026-02-17 13:04:46');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `favorite_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `property_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `unique_favorite` (`user_id`,`property_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_property_id` (`property_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inquiries`
--

DROP TABLE IF EXISTS `inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquiries` (
  `inquiry_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `user_id` int NOT NULL,
  `agent_id` int NOT NULL,
  `message` text NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_phone` varchar(20) DEFAULT NULL,
  `status` enum('new','read','replied','closed') DEFAULT 'new',
  `replied_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`inquiry_id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `inquiries_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `inquiries_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `inquiries_ibfk_3` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inquiries`
--

LOCK TABLES `inquiries` WRITE;
/*!40000 ALTER TABLE `inquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `inquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL COMMENT 'references users.user_id',
  `message_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_conversation_time` (`conversation_id`,`created_at` DESC),
  KEY `idx_unread` (`conversation_id`,`is_read`,`sender_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,2,44,'Hello',1,'2025-11-20 21:03:04'),(2,4,44,'Hello I was asking about the schools around this area',1,'2025-11-20 21:12:06'),(3,4,44,'How long to town and whats the fare',1,'2025-11-20 21:25:12'),(4,2,44,'Hello',1,'2025-11-20 21:34:21'),(5,2,41,'Hae',1,'2025-11-20 21:35:01'),(6,2,44,'How are you today',1,'2025-11-21 19:17:54'),(7,6,44,'Hello',1,'2025-11-21 19:18:58'),(8,2,41,'I am good ho are you',1,'2025-11-21 19:20:06'),(9,6,41,'Hae',1,'2025-11-21 19:20:28'),(10,1,44,'Hello',1,'2025-11-21 19:25:12'),(11,1,41,'hello',1,'2025-11-21 19:26:12'),(12,2,44,'Hello',1,'2025-11-22 07:44:07'),(13,2,44,'Hae',1,'2025-11-23 08:38:47'),(14,7,44,'Hello',1,'2025-11-23 08:39:24'),(15,7,41,'Hae',1,'2025-11-23 08:41:06'),(16,10,44,'Hello how are you',1,'2025-11-24 16:20:39'),(17,2,44,'Hello',1,'2025-11-25 11:56:14'),(18,12,44,'Hello',1,'2025-11-27 09:20:55'),(19,13,17,'hello',1,'2025-11-27 09:33:37'),(20,12,44,'Hello',1,'2025-11-27 09:34:11'),(21,13,17,'Hello',1,'2025-11-27 09:35:37'),(22,14,17,'Hello',1,'2025-11-27 09:35:50'),(23,11,44,'Hello',1,'2025-11-27 09:36:27'),(24,11,12,'Hello Ruth',1,'2025-11-27 09:37:41'),(25,13,12,'Hae',0,'2025-11-27 09:38:06'),(26,11,12,'Hae ruth',1,'2025-11-27 19:18:49'),(27,11,12,'hae',1,'2025-11-27 19:21:56'),(28,13,12,'Niaje',0,'2025-11-27 19:22:21'),(29,13,12,'Hello',0,'2025-11-27 19:24:04'),(30,11,12,'Hello',1,'2025-11-27 19:25:49'),(31,11,12,'hello',1,'2025-11-27 19:36:54'),(32,13,12,'hello',0,'2025-11-27 19:45:20'),(33,13,12,'Hello',0,'2025-11-27 19:48:08'),(34,12,12,'Hello',1,'2025-11-27 19:50:52'),(35,11,12,'Hae',1,'2025-11-27 20:01:38'),(36,11,12,'HAE',1,'2025-11-28 07:35:08'),(37,11,12,'Hello',1,'2025-11-28 07:59:08'),(38,11,12,'Hello',1,'2025-11-28 08:00:27'),(39,14,12,'hae',0,'2025-11-28 08:28:41'),(40,2,41,'Hello',1,'2025-12-06 06:57:42'),(41,10,44,'Hello',1,'2025-12-06 07:56:29'),(42,17,44,'hello',1,'2025-12-06 09:27:04'),(43,17,44,'Hello',1,'2025-12-06 09:28:09'),(44,10,12,'hello',1,'2025-12-06 09:37:36'),(45,18,44,'hey',1,'2025-12-06 16:00:01'),(46,18,12,'hae',1,'2025-12-06 16:01:10'),(47,17,44,'hae',1,'2025-12-06 18:45:59'),(48,17,41,'Hello',1,'2025-12-06 18:47:25'),(49,19,44,'Hae',1,'2025-12-07 14:12:01'),(50,19,44,'Hae',1,'2025-12-07 14:12:01'),(51,19,41,'Hae',1,'2025-12-07 14:12:48'),(52,21,44,'hae',1,'2025-12-07 15:57:59'),(53,21,41,'Hae',1,'2025-12-07 15:58:35'),(54,22,44,'Hello',1,'2026-01-09 15:40:43'),(55,22,41,'Hello',1,'2026-01-09 16:28:57'),(56,24,44,'Hello',0,'2026-01-30 08:11:23'),(57,26,44,'Hello',1,'2026-01-30 08:15:36'),(58,29,44,'Hello',1,'2026-02-07 19:16:37'),(59,30,44,'Hello',1,'2026-02-07 19:17:02'),(60,26,12,'Hello',1,'2026-02-07 19:18:16'),(61,30,44,'Hawayu',1,'2026-02-07 19:25:41'),(62,31,44,'Hello',1,'2026-02-07 19:25:53'),(63,29,44,'Hello',1,'2026-02-08 12:22:51'),(64,29,12,'Hae',1,'2026-02-08 12:23:11'),(65,31,44,'Hello.Uko aje',0,'2026-02-14 14:04:53'),(66,30,44,'Hello',0,'2026-02-15 19:16:18'),(67,25,44,'Hello',1,'2026-02-17 12:56:39'),(68,32,52,'Hello',0,'2026-02-17 12:59:57'),(69,33,53,'Niaje',0,'2026-02-17 13:02:04'),(70,34,44,'Hello',1,'2026-02-17 13:02:36'),(71,34,12,'Hello',0,'2026-02-17 13:04:46');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_type` (`type`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `payment_summary`
--

DROP TABLE IF EXISTS `payment_summary`;
/*!50001 DROP VIEW IF EXISTS `payment_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `payment_summary` AS SELECT 
 1 AS `id`,
 1 AS `property_id`,
 1 AS `property_title`,
 1 AS `agent_id`,
 1 AS `agent_name`,
 1 AS `amount`,
 1 AS `phone_number`,
 1 AS `mpesa_receipt`,
 1 AS `status`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `agent_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkout_request_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mpesa_receipt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_request_id` (`checkout_request_id`),
  KEY `idx_checkout_request` (`checkout_request_id`),
  KEY `idx_agent` (`agent_id`),
  KEY `idx_property` (`property_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transactions`
--

LOCK TABLES `payment_transactions` WRITE;
/*!40000 ALTER TABLE `payment_transactions` DISABLE KEYS */;
INSERT INTO `payment_transactions` VALUES (1,16,41,400.00,'254114151187','ws_CO_14112025135238331114151187',NULL,NULL,'pending',NULL,'2025-11-14 10:52:37','2025-11-14 10:52:37'),(2,17,41,50.00,'254114151187','ws_CO_14112025135431945114151187',NULL,NULL,'pending',NULL,'2025-11-14 10:54:31','2025-11-14 10:54:31'),(3,18,41,50.00,'254114151187','ws_CO_14112025135902546114151187',NULL,NULL,'pending',NULL,'2025-11-14 10:59:02','2025-11-14 10:59:02'),(4,20,41,50.00,'254114151187','ws_CO_14112025153347662114151187','TKEDUA6N8I',NULL,'completed',NULL,'2025-11-14 12:33:47','2025-11-14 14:25:58'),(5,22,12,400.00,'254114151187','ws_CO_24112025160758056114151187',NULL,NULL,'pending',NULL,'2025-11-24 13:07:58','2025-11-24 13:07:58'),(6,23,12,460.00,'254114151187','ws_CO_24112025161535653114151187',NULL,NULL,'pending',NULL,'2025-11-24 13:15:36','2025-11-24 13:15:36');
/*!40000 ALTER TABLE `payment_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `property_id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `property_type` varchar(50) DEFAULT NULL,
  `listing_type` enum('sale','rent') NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `viewing_fee` decimal(10,2) DEFAULT '0.00',
  `bedrooms` int DEFAULT NULL,
  `bathrooms` int DEFAULT NULL,
  `address_line1` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `status` enum('draft','active','pending','sold','rented','inactive') DEFAULT 'draft',
  `images` json DEFAULT NULL,
  `videos` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `units_available` int DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_bundle` tinyint(1) DEFAULT '0',
  `bundle_id` int DEFAULT NULL,
  PRIMARY KEY (`property_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_listing_type` (`listing_type`),
  KEY `idx_property_type` (`property_type`),
  KEY `idx_city` (`city`),
  KEY `idx_price` (`price`),
  KEY `idx_created` (`created_at`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_property_agent` (`agent_id`),
  KEY `idx_bundle` (`bundle_id`,`is_bundle`),
  FULLTEXT KEY `idx_search` (`title`,`description`,`address_line1`,`city`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,2,'Modern 3 Bedroom Apartment in Westlands','Beautiful modern apartment with stunning views of the city. Located in the heart of Westlands with easy access to shopping malls, restaurants, and schools.','apartment','sale',15000000.00,0.00,3,3,'Mwanzi Road','Nairobi','active','[\"https://example.com/image1.jpg\", \"https://example.com/image2.jpg\"]',NULL,'2025-10-11 18:29:55','2025-10-11 18:29:55',1,0,0,NULL),(2,12,'Kileleshwa Nairobi Villa','','Villa','rent',34000.00,0.00,3,1,'Kileleshwa Nairobi','Kileleshwa Nairobi','draft','[\"/uploads/1760947838309.PNG\"]',NULL,'2025-10-20 08:10:38','2025-10-20 08:10:38',1,0,0,NULL),(3,12,'Westlands,Nairobi Villa','','Villa','rent',19999.00,0.00,3,3,'Westlands,Nairobi','Westlands','active','[\"/uploads/1760988303266.PNG\"]',NULL,'2025-10-20 19:25:03','2025-10-20 19:25:03',1,0,0,NULL),(4,12,'Kileleshwa, Nairobi Villa','','Villa','rent',23000.00,0.00,3,2,'Kileleshwa, Nairobi','Kileleshwa','active','[\"/uploads/1760989809769.PNG\"]',NULL,'2025-10-20 19:50:09','2025-10-20 19:50:09',2,0,0,NULL),(5,12,'Milimani, Nairobi Villa','This stunning villa offers the perfect blend of luxury, comfort, and modern living. Featuring spacious, elegantly designed interiors, it includes multiple bedrooms with en-suite bathrooms, a fully equipped modern kitchen, and an expansive living area that opens to a private garden and swimming pool.','Villa','rent',21000.00,0.00,3,1,'Milimani, Nairobi','Milimani','active','[\"/uploads/1761034865765.PNG\"]',NULL,'2025-10-21 08:21:05','2025-10-21 08:21:05',2,0,0,NULL),(6,12,'Kilimani,Nairobi Villa','The villa boasts high-end finishes, large windows for natural light, and ample outdoor space ideal for relaxation or entertaining guests. Additional amenities include a gym room, ample parking, a rooftop terrace with panoramic views, and 24-hour security for peace of mind. Perfectly suited for those seeking an exclusive and tranquil lifestyle, this villa combines elegance with convenience in every detail.','Villa','rent',23000.00,0.00,3,2,'Kilimani,Nairobi','Kilimani','active','[\"/uploads/1761037273969.PNG\"]',NULL,'2025-10-21 09:01:14','2025-10-21 09:01:14',1,0,0,NULL),(7,41,'Apartment in Kilimani,Nairobi','This apartment offers the perfect blend of luxury, comfort, and modern living. Featuring spacious, elegantly designed interiors, it includes multiple bedrooms with en-suite bathrooms, a fully equipped modern kitchen, and an expansive living area that opens to a private garden and swimming pool.','Apartment','rent',21000.00,0.00,2,2,'Kilimani,Nairobi','Nairobi','active','[]',NULL,'2025-10-21 15:45:29','2025-10-21 15:45:29',5,0,0,NULL),(8,41,'Apartment in Utawala,Nairobi','This modern apartment offers a perfect blend of comfort and convenience, located in a vibrant neighborhood close to essential amenities. Residents enjoy easy access to shopping centers, supermarkets, restaurants, and cafés all within walking distance. The area is well-connected by public transport, making commuting simple and efficient.','Apartment','rent',18000.00,0.00,2,2,'Utawala,Nairobi','Nairobi','active','[\"/uploads/1761122261407.PNG\", \"/uploads/1761122261467.PNG\", \"/uploads/1761122261488.PNG\", \"/uploads/1761122261501.PNG\"]',NULL,'2025-10-22 08:37:41','2025-10-22 08:37:41',1,0,0,NULL),(9,41,'Apartment in Kilimani,Nairobi','The area is well-connected by public transport, making commuting simple and efficient. Nearby, you’ll find reputable schools, healthcare facilities, and recreational spots such as parks and fitness centers. With its prime location and welcoming atmosphere, this apartment provides a comfortable urban lifestyle ideal for both professionals and families.','Apartment','rent',23000.00,0.00,2,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1761123391723.PNG\", \"/uploads/1761123391733.PNG\", \"/uploads/1761123391742.PNG\", \"/uploads/1761123391751.PNG\"]',NULL,'2025-10-22 08:56:31','2025-10-22 08:56:31',8,0,0,NULL),(10,41,'Apartment in Kileleshwa Nairobi','Its a comfortable unit with an outdoor swimming pool and GYM.School and hospital are nearby','Apartment','rent',2300.00,0.00,3,2,'Kileleshwa Nairobi','Kileleshwa Nairobi','active','[\"/uploads/1762333810449.PNG\", \"/uploads/1762333810461.PNG\", \"/uploads/1762333810474.PNG\", \"/uploads/1762333810482.PNG\"]',NULL,'2025-11-05 09:10:10','2025-11-05 09:10:10',2,0,0,NULL),(11,12,'Condo in CBD Nairobi','No additional infor','Condo','rent',2300.00,0.00,3,2,'CBD Nairobi','CBD Nairobi','active','[\"/uploads/1762359560679.PNG\"]',NULL,'2025-11-05 16:19:20','2025-11-05 16:19:20',1,0,0,NULL),(12,12,'Apartment in Westlands','Wifi available.Schools and hospitals nearby','Apartment','rent',23000.00,0.00,3,2,'Westlands','Westlands','active','[\"/uploads/1762363919847.PNG\", \"/uploads/1762363919878.PNG\", \"/uploads/1762363919902.PNG\", \"/uploads/1762363919915.PNG\"]',NULL,'2025-11-05 17:31:59','2025-11-05 17:31:59',1,0,0,NULL),(13,41,'Apartment in Westlands,Nairobi','','Apartment','rent',10000.00,0.00,3,2,'Westlands,Nairobi','Nairobi','active','[\"/uploads/1763109608355.PNG\", \"/uploads/1763109608389.PNG\", \"/uploads/1763109608412.PNG\", \"/uploads/1763109608420.PNG\"]',NULL,'2025-11-14 08:40:08','2025-11-14 08:40:08',2,0,0,NULL),(14,41,'Apartment in Westlands,Nairobi','','Apartment','rent',10000.00,0.00,3,4,'Westlands,Nairobi','Nairobi','active','[\"/uploads/1763109755208.PNG\", \"/uploads/1763109755287.PNG\", \"/uploads/1763109755304.PNG\", \"/uploads/1763109755313.PNG\"]',NULL,'2025-11-14 08:42:35','2025-11-14 08:42:35',2,0,0,NULL),(15,41,'Condo in Westlands,Nairobi','','Condo','rent',14998.00,0.00,3,2,'Westlands,Nairobi','Nairobi','active','[\"/uploads/1763110432868.PNG\", \"/uploads/1763110432888.PNG\", \"/uploads/1763110432898.PNG\", \"/uploads/1763110432909.PNG\"]',NULL,'2025-11-14 08:53:53','2025-11-14 08:53:53',1,0,0,NULL),(16,41,'Villa in Kilimani,Nairobi','','Villa','rent',20000.00,0.00,3,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763117531276.PNG\", \"/uploads/1763117531291.PNG\", \"/uploads/1763117531311.PNG\", \"/uploads/1763117531317.PNG\"]',NULL,'2025-11-14 10:52:11','2025-11-14 10:52:11',2,0,0,NULL),(17,41,'Villa in Kilimani,Nairobi','','Villa','rent',2000.00,0.00,3,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763117667371.PNG\", \"/uploads/1763117667399.PNG\", \"/uploads/1763117667413.PNG\", \"/uploads/1763117667429.PNG\"]',NULL,'2025-11-14 10:54:27','2025-11-14 10:54:27',1,0,0,NULL),(18,41,'Villa in Kilimani,Nairobi','','Villa','rent',1998.00,0.00,4,4,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763117933392.PNG\", \"/uploads/1763117933408.PNG\", \"/uploads/1763117933418.PNG\", \"/uploads/1763117933425.PNG\"]',NULL,'2025-11-14 10:58:53','2025-11-14 10:58:53',1,0,0,NULL),(19,41,'Villa in Kilimani,Nairobi','','Villa','rent',2000.00,0.00,3,2,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763123547212.PNG\", \"/uploads/1763123547220.PNG\", \"/uploads/1763123547233.PNG\", \"/uploads/1763123547245.PNG\"]',NULL,'2025-11-14 12:32:27','2025-11-14 12:32:27',1,0,0,NULL),(20,41,'Villa in Kilimani,Nairobi','','Villa','rent',2000.00,0.00,3,3,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763123621114.PNG\", \"/uploads/1763123621124.PNG\", \"/uploads/1763123621133.PNG\", \"/uploads/1763123621143.PNG\"]',NULL,'2025-11-14 12:33:41','2025-11-14 14:25:58',1,1,0,NULL),(21,41,'Condo in Kilimani,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Condo','rent',23000.00,0.00,3,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1763836976933.PNG\", \"/uploads/1763836976940.PNG\", \"/uploads/1763836976946.PNG\", \"/uploads/1763836976950.PNG\"]',NULL,'2025-11-22 18:42:56','2025-11-22 18:42:56',2,0,0,NULL),(22,12,'Apartment in Killimani, Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',20000.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/1763989660068.PNG\", \"/uploads/1763989660077.PNG\", \"/uploads/1763989660094.PNG\", \"/uploads/1763989660101.PNG\"]',NULL,'2025-11-24 13:07:40','2025-11-24 13:07:40',2,0,0,NULL),(23,12,'Condo in Killimani, Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Condo','rent',23000.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/1763990114093.PNG\", \"/uploads/1763990114173.PNG\", \"/uploads/1763990114176.PNG\", \"/uploads/1763990114182.PNG\"]',NULL,'2025-11-24 13:15:14','2025-11-24 13:15:14',3,0,0,NULL),(24,12,'Apartment in Kilimani,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',23000.00,0.00,3,2,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/ebe96dec775b30063387bf0c156342ed.png\", \"/uploads/396bb0001a3e339216de68bab18da7bd.png\", \"/uploads/8f6cc55dbb2b5b965b2e31f7afdb1c8a.png\", \"/uploads/580c787be3c33c0055b42b110ad8299b.png\"]',NULL,'2025-11-26 07:34:26','2025-11-26 07:34:26',2,1,0,NULL),(25,12,'Apartment in Westlands,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',20000.00,0.00,2,2,'Westlands,Nairobi','Nairobi','active','[\"/uploads/2806a6db7bbb2813eaf83cc0435dca0c.png\", \"/uploads/fc644bf1ff93f676e43d95a3326aa8ed.png\", \"/uploads/f8ea734cacc6ec09e8e35bbf4ea90cf1.png\", \"/uploads/8ac133f6bbd46d6884afae02826eb4bc.png\"]',NULL,'2025-11-26 07:40:03','2025-11-26 07:40:03',2,1,0,NULL),(26,12,'Apartment in Kilimani,Nairobi','','Apartment','rent',23000.00,0.00,2,3,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/a5447932779a9b27d304431f370498eb.png\", \"/uploads/f02b429891c5135d41cba874749e99b5.png\", \"/uploads/de676971975da0145809dc74817c6563.png\", \"/uploads/51b1eefb455a1130f02a8976180c0fe0.png\"]',NULL,'2025-11-26 16:19:13','2025-11-26 16:19:13',3,1,0,NULL),(27,12,'Apartment in Kilimani,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',25000.00,0.00,3,3,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/717c7f12f29186b8d03394988839ae6d.png\", \"/uploads/1cfa609a8e0eed960a966899a90d1bae.png\", \"/uploads/a49c19d83d56851d364b6b1b50d94e08.png\", \"/uploads/ebde35307557e40194cb0a81b4a24813.png\"]',NULL,'2025-11-27 10:02:17','2025-11-27 10:02:17',1,1,0,NULL),(28,12,'Apartment in Kilimani,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',20000.00,0.00,2,3,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/e0098a581a50b8746aab60cfbb3f62b8.png\", \"/uploads/b676e4ddd21ee7bae13d37bdc5b252ec.png\", \"/uploads/541ed6210df90d43d24cd106d02a092f.png\", \"/uploads/1f7482c8d713e20f7ea8b58f4560d970.png\"]',NULL,'2025-11-27 10:18:37','2025-11-27 10:18:37',3,1,0,NULL),(29,12,'Apartment in Kilimani,Nairobi','This modern condo offers a bright, open layout with high-quality finishes throughout. The spacious living area flows seamlessly to large windows that bring in plenty of natural light. A well-designed kitchen and comfortable bedrooms provide both elegance and practicality. The building features secure access and convenient amenities for a relaxed lifestyle. Perfect for anyone seeking a stylish, low-maintenance home in a prime location.','Apartment','rent',23000.00,0.00,3,2,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/b537fb8fc2ce8c5cb8954e66382d0cc7.png\", \"/uploads/e02b129e4f00f515ff8d0fac78a14df0.png\", \"/uploads/fb60e38b96ce354ff64cb3e7079749db.png\", \"/uploads/dd94ce21434bf3304147640905ac300a.png\"]',NULL,'2025-11-27 10:21:52','2025-11-27 10:21:52',2,1,0,NULL),(30,41,'Apartment in Killimani, Nairobi','Step into this beautifully designed apartment featuring a bright, open-plan living area, modern finishes, and plenty of natural light. The spacious bedroom offers a serene retreat, while the contemporary kitchen comes equipped with sleek cabinetry and high-quality fixtures. Perfectly positioned near key amenities, this home blends comfort, convenience, and stylish urban living.','Apartment','rent',20000.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/f5f651092d460a55a4150f01f7447673.png\", \"/uploads/789934592162a8ee97b458563681f77e.png\", \"/uploads/3c942911cbc924a846eac895f0d57182.png\", \"/uploads/9be94d5a57c92d77b0ddd57b8fcb1557.png\"]',NULL,'2025-12-06 07:00:47','2025-12-06 07:00:47',1,1,0,NULL),(31,41,'Apartment in Killimani, Nairobi','Step into this modern and beautifully finished 2-bedroom apartment, perfectly designed for comfort and convenience. The spacious living area features large windows that fill the home with natural light, leading out to a private balcony with relaxing views. The open-plan kitchen comes fitted with quality cabinetry and ample workspace, ideal for everyday living. Both bedrooms are well-sized, with the master offering built-in wardrobes for extra storage.','Apartment','rent',20000.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/f45bfe0338466f0e4a81b0cd910825cc.png\", \"/uploads/dcc73603c7960a7b1ac1094b7f6dc9fe.png\", \"/uploads/2850e714ec9af290d99810977f3ab452.png\", \"/uploads/62f89f6414687549d904c321881b0b0e.png\"]',NULL,'2025-12-06 19:08:08','2025-12-06 19:08:08',2,1,0,NULL),(32,41,'Apartment in Killimani, Nairobi','Step into this modern and beautifully finished 2-bedroom apartment, perfectly designed for comfort and convenience. The spacious living area features large windows that fill the home with natural light, leading out to a private balcony with relaxing views. The open-plan kitchen comes fitted with quality cabinetry and ample workspace, ideal for everyday living. Both bedrooms are well-sized, with the master offering built-in wardrobes for extra storage.','Apartment','rent',21002.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/9b7b3ffeb60bc7b6ce570537a8355cab.png\", \"/uploads/997d4ce31c0407f2853f9e3a9ca4d611.png\", \"/uploads/de46f5b380b32d81c3c8d7fc3fd244a4.png\", \"/uploads/02776a1f9b3cf50ae247dd793846dd1a.png\"]',NULL,'2025-12-06 19:10:04','2025-12-06 19:10:04',2,1,0,NULL),(33,41,'Apartment in Killimani, Nairobi','Step into this beautifully designed apartment featuring a bright, open-plan living area, modern finishes, and plenty of natural light. The spacious bedroom offers a serene retreat, while the contemporary kitchen comes equipped with sleek cabinetry and high-quality fixtures. Perfectly positioned near key amenities, this home blends comfort, convenience, and stylish urban living.','Apartment','rent',23400.00,0.00,2,2,'Killimani, Nairobi','Nairobi','active','[\"/uploads/6b8be38ce4f44bc4e5694d9c92aab428.png\", \"/uploads/d37fe6c62c81b9351798367cad0a1664.png\", \"/uploads/86799d9d1eb92ee04087d175d4c7070e.png\", \"/uploads/e114d22f5318c0c1bd674d25039c7046.png\"]',NULL,'2025-12-06 19:16:12','2025-12-06 19:16:12',2,1,0,NULL),(34,41,'Villa in Killimani, Nairobi','Step into this beautifully designed apartment featuring a bright, open-plan living area, modern finishes, and plenty of natural light. The spacious bedroom offers a serene retreat, while the contemporary kitchen comes equipped with sleek cabinetry and high-quality fixtures. Perfectly positioned near key amenities, this home blends comfort, convenience, and stylish urban living.','Apartment','rent',19000.00,0.00,2,2,'Killimani, Nairobi','Nairobi','active','[\"/uploads/15c51b1b567c6cadd19342c6e7c8fb4e.png\", \"/uploads/65c915b9df0d758ce743614ab5e42679.png\", \"/uploads/fd77b76b7659e6deca428c74b4b92f88.png\", \"/uploads/f38a10b7d89ccfaa43e011f3ce70b6ec.png\"]',NULL,'2025-12-06 19:21:19','2025-12-06 19:21:19',2,1,0,NULL),(35,41,'Condo in Killimani, Nairobi','Step into this beautifully designed apartment featuring a bright, open-plan living area, modern finishes, and plenty of natural light. The spacious bedroom offers a serene retreat, while the contemporary kitchen comes equipped with sleek cabinetry and high-quality fixtures. Perfectly positioned near key amenities, this home blends comfort, convenience, and stylish urban living.','Condo','rent',21000.00,0.00,2,3,'Killimani, Nairobi','Nairobi','active','[\"/uploads/b43e3fa1f1a20b864a8d3da844da5b0a.png\", \"/uploads/f79a8b6ad74ec673b6ecfdddbf3e5b59.png\", \"/uploads/bba8bda388f4061e18ce3791e7010799.png\", \"/uploads/c6dffc4e5e996f3ca9cf06963610d921.png\"]',NULL,'2025-12-06 19:24:13','2025-12-06 19:24:13',2,1,0,NULL),(36,41,'Condo in Kilimani,Nairobi','Step into this modern and beautifully finished 2-bedroom apartment, perfectly designed for comfort and convenience. The spacious living area features large windows that fill the home with natural light, leading out to a private balcony with relaxing views. The open-plan kitchen comes fitted with quality cabinetry and ample workspace, ideal for everyday living. Both bedrooms are well-sized, with the master offering built-in wardrobes for extra storage.','Condo','rent',19000.00,0.00,2,2,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/aee40a861ac222bc6c3fc709d73f92de.png\", \"/uploads/d454549128f7ba4807248dbcec0f1a06.png\", \"/uploads/efb200eb92deab9a2c0d72c134bcef59.png\", \"/uploads/53965abb34e2501c7a18a7bd1d503db5.png\"]',NULL,'2025-12-06 19:33:00','2025-12-06 19:33:00',3,1,0,NULL),(37,12,'Apartment in Westlands, Nairobi','This stunning home perfectly blends modern elegance with everyday comfort, offering an open-concept layout bathed in natural light through expansive windows. The gourmet kitchen, featuring premium finishes and high-end appliances, flows seamlessly into an inviting living area, making it an ideal space for both quiet evenings and lively entertaining','Apartment','rent',12000.00,0.00,4,3,'Westlands, Nairobi','Nairobi','active','[\"/uploads/3d5ed23801f1c8e0d35f51d6f82e6649.png\", \"/uploads/3332eba800e616bff021500f32687f79.png\", \"/uploads/33d1280875dd7ef687568c629f9b677c.png\", \"/uploads/e87af541cfcd17f163351ee7f11aa5b4.png\"]',NULL,'2025-12-21 18:54:50','2025-12-21 18:54:50',3,1,0,NULL),(38,41,'Apartment in Killimani, Nairobi','Two-story building nestled in a quiet suburban neighborhood. Its exterior is painted a soft cream with wooden accents, giving it a warm and welcoming appearance. Inside, large windows allow golden sunlight to flood the rooms, creating a bright and cheerful atmosphere.','Apartment','rent',20001.00,0.00,2,1,'Killimani, Nairobi','Nairobi','active','[\"/uploads/ef64dcff567d91b1c258497cc8574699.png\", \"/uploads/232fda49bfef4c12ce067659f8f99de9.png\", \"/uploads/99d0d59052f8990a4c86f205825be727.png\", \"/uploads/c42dfbffc52eab8a370fbd839003f927.png\"]',NULL,'2026-01-05 06:30:17','2026-01-05 06:30:17',4,1,0,NULL),(39,12,'Apartment in kiliamni','','Apartment','rent',23000.00,0.00,3,3,'kiliamni','kiliamni','active','[\"/uploads/2bd14245de2e8a675f14108ce98dc477.png\", \"/uploads/cbf8da5816a25f70c1e47d7cf32391bf.png\", \"/uploads/4dc22eb6d8022d0653ce0262b24ed1c5.png\", \"/uploads/d234e8387ff4d2ae1bfe9912dc2e620d.png\"]',NULL,'2026-01-09 17:05:18','2026-01-09 17:05:18',3,1,0,NULL),(40,12,'Apartment in Kilimani,Nairobi','','Apartment','rent',22999.00,700.00,4,4,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/4293e13aa25a6e57bcd1694150424961.png\", \"/uploads/909b1207f1e290d622d80b4731650ad2.png\", \"/uploads/fd42ca4f2d48e94d2f6e790fc2ed9687.png\", \"/uploads/a34e9eb10085acf367e051cdbc4a022f.png\"]','[\"/uploads/videos/5f9fbee7d7dada41e6159c877df84414.mp4\"]','2026-01-29 19:34:47','2026-01-29 19:34:47',1,1,1,NULL),(41,12,'Apartment in Kilimani Nairobi','','Apartment','rent',33333.00,40000.00,4,4,'Kilimani Nairobi','Kilimani Nairobi','active','[\"/uploads/0f18d7200d9caa383d4437cb003242df.png\", \"/uploads/d59a5a38b0d695e46d07d19dcc8b24f6.png\", \"/uploads/bac8d0e6ab94f4d1dffe5dce065d13c6.png\", \"/uploads/1084e480f25ff3a891ffbfa289fb3a6d.png\"]','[\"/uploads/videos/4698f246baf6f7be2faaa344515450cb.mp4\"]','2026-01-29 19:38:47','2026-01-29 19:38:47',4,1,1,1),(42,12,'Apartment in Kilimani,Nairobi','','Apartment','rent',4.00,40000.00,3,4,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/0a5e035f72bcc42dd0987e9997a50e7c.png\", \"/uploads/dd554297698318ba9ca1af2ac5009bf3.png\", \"/uploads/0d68037dd325c02b590a015431272ea9.png\", \"/uploads/6d6e16e0e50fc92e10d2783a21e31ca3.png\"]','[\"/uploads/videos/78009353b4679e0b123f4570819ce365.mp4\"]','2026-01-29 19:38:48','2026-01-29 19:38:48',4,1,1,1),(43,12,'Airbnb in Killimani, Nairobi','','Airbnb','rent',22222.00,400.00,3,3,'Killimani, Nairobi','Nairobi','active','[\"/uploads/7254c574cf9b07c76251bd9c37b224fa.png\", \"/uploads/06569fbcc551e3c9d86923079b47c6ad.png\", \"/uploads/c7497a68fd4cfac687718e416ff1f5bd.png\", \"/uploads/ef7b4bc1436278f7785a2bb7f36750c1.png\"]','[\"/uploads/videos/76481850be611ad0d5c6eb021357b686.mp4\"]','2026-01-30 08:17:03','2026-01-30 08:17:03',3,1,1,NULL),(44,12,'Apartment in Killimani, Nairobi','Whether you’re working from home in your quiet, sun-drenched office space or entertaining on your private balcony with city views, this home is designed for your lifestyle.You’ll enjoy immediate access to the city’s best dining and shopping. Schedule your private tour today—this rare gem won\'t stay on the market for long!\"','Apartment','rent',23000.00,500.00,3,3,'Killimani, Nairobi','Nairobi','active','[\"/uploads/da01362038fdb4abd6a9e170a92e8175.png\", \"/uploads/fc9283dedb426736045168220e3b46c3.png\", \"/uploads/75e398167f772c5dd811cb1f83260bc4.png\", \"/uploads/d75c722f85ffcbadf806d085c4b9177f.png\"]','[\"/uploads/videos/05272d57ae4d58d3c1cf7854ec450790.mp4\"]','2026-02-06 13:32:25','2026-02-06 13:32:25',3,1,1,NULL),(45,12,'Airbnb in Killimani, Nairobi','Whether you’re working from home in your quiet, sun-drenched office space or entertaining on your private balcony with city views, this home is designed for your lifestyle. You’ll enjoy immediate access to the city’s best dining and shopping. Schedule your private tour today—this rare gem won\'t stay on the market for long!\"','Airbnb','rent',19999.00,500.00,3,4,'Killimani, Nairobi','Nairobi','active','[\"/uploads/af97e6e17ae5992a38d9deb52b4eb487.png\", \"/uploads/67c71b6c77815ca43516d715c12ee225.png\", \"/uploads/8045dc5b98326f4332f1ef7847519463.png\", \"/uploads/728cee3c3cf1e73948fcccb20b7bef7e.png\"]','[\"/uploads/videos/81b301ba93e0847a938e3c186ee8a51e.mp4\"]','2026-02-06 13:37:04','2026-02-06 13:37:04',4,1,1,NULL),(46,12,'Apartment in Kilimani,Nairobi','Whether you’re working from home in your quiet, sun-drenched office space or entertaining on your private balcony with city views, this home is designed for your lifestyle. Located just steps from [Local Landmark or Transit Station], you’ll enjoy immediate access to the city’s best dining and shopping. Schedule your private tour today—this rare gem won\'t stay on the market for long!\"','Apartment','rent',33000.00,1500.00,3,4,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/1bce3e3270a21bde919767dc35fe774c.png\", \"/uploads/b7cce517ddf21df5b3437b3dee45b9c5.png\", \"/uploads/8862303ac361c73f9a5712fdad01e3cd.png\", \"/uploads/3ab462f8118f49ac147ec60c08393b58.png\"]','[\"/uploads/videos/96d059c47c78a148cc7a3bd9fec82fc7.mp4\"]','2026-02-06 13:41:54','2026-02-06 13:41:54',3,1,1,2),(47,12,'Apartment in Kilimani,Nairobi','Whether you’re working from home in your quiet, sun-drenched office space or entertaining on your private balcony with city views, this home is designed for your lifestyle. Located just steps from [Local Landmark or Transit Station], you’ll enjoy immediate access to the city’s best dining and shopping. Schedule your private tour today—this rare gem won\'t stay on the market for long!\"','Apartment','rent',32000.00,1500.00,4,4,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/8895ff2b76ff8d3372acaf608c18092d.png\", \"/uploads/adc45d55be43cba05d23ea5dcda7d239.png\", \"/uploads/1dc2b1e888c243833577dc13ae19865a.png\", \"/uploads/0a55ae0f158df4e181cb1c69c5299a83.png\"]','[\"/uploads/videos/e112b27827ae2999bb82181c2e61be82.mp4\"]','2026-02-06 13:41:55','2026-02-06 13:41:55',3,1,1,2),(48,41,'Villa in Kilimani Nairobi','Step into a world of unparalleled elegance with this stunning, custom-designed villa, where sophisticated architecture meets a seamless indoor-outdoor lifestyle. Nestled in a prestigious, gated enclave, this expansive retreat features soaring ceilings and floor-to-ceiling glass walls that flood the open-concept living areas with natural light.','Villa','rent',23000.00,1200.00,3,3,'Kilimani Nairobi','Kilimani Nairobi','active','[\"/uploads/bd54494d0ff3645e12b0dac34541debb.png\", \"/uploads/43881faeb678d8211a7db83019e55c48.png\", \"/uploads/b764846c0d9d1d1b6479ae15b75e2912.png\", \"/uploads/acc194978d005845f8b7b66e4d78284b.png\"]','[\"/uploads/videos/c4d5f9f5fb234216e72691daa51fb6dc.mp4\", \"/uploads/videos/6b6906e0fa6012d7ad682e146a84dfc8.mp4\"]','2026-02-10 07:30:36','2026-02-10 07:30:36',3,1,1,3),(49,41,'Villa in Kilimani,Nairobi','Step into a world of unparalleled elegance with this stunning, custom-designed villa, where sophisticated architecture meets a seamless indoor-outdoor lifestyle. Nestled in a prestigious, gated enclave, this expansive retreat features soaring ceilings and floor-to-ceiling glass walls that flood the open-concept living areas with natural light.','Villa','rent',21000.00,1200.00,3,3,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/87e5e452b122c417351235fc4ccb1e8b.png\", \"/uploads/8a8489fd34c0baecbd119cc73ed5057a.png\", \"/uploads/df5cf5d1afb1192db0d3c66b65dd3914.png\", \"/uploads/324e35935e1db2d1f606bb0c5a02aae3.png\"]','[\"/uploads/videos/ed370b3d2529425f4111e4de401695fc.mp4\", \"/uploads/videos/f9fdeba3155fc071e77b5a8a07f288be.mp4\"]','2026-02-10 07:30:37','2026-02-10 07:30:37',3,1,1,3),(50,41,'Villa in Kilimani, Nairobi','Step into a world of unparalleled elegance with this stunning, custom-designed villa, where sophisticated architecture meets a seamless indoor-outdoor lifestyle. Nestled in a prestigious, gated enclave, this expansive retreat features soaring ceilings and floor-to-ceiling glass walls that flood the open-concept living areas with natural light.','Villa','rent',21000.00,1200.00,4,3,'Kilimani, Nairobi','Nairobi','active','[\"/uploads/135cce0b51cdcaaa6d79f4fcd02b3d33.png\", \"/uploads/7ce81184d4738241014a50089d5e24be.png\", \"/uploads/bb1c95f153276af8fc933f04779f55b2.png\", \"/uploads/8b3467a0d0c9320ac7caf89513c228ef.png\"]','[\"/uploads/videos/e08795253d5c2950cc76ef718763ecde.mp4\", \"/uploads/videos/0eb17ff429f3c1f78469288741ea8628.mp4\"]','2026-02-10 07:30:38','2026-02-10 07:30:38',3,1,1,3),(51,12,'Apartment in kilimani,Nairobi','This modern apartment offers a comfortable and stylish living experience, ideal for individuals, couples, or small families. It features a well-designed layout with spacious, naturally lit rooms, a contemporary kitchen fitted with quality finishes, and a clean, elegant bathroom.','Apartment','rent',18000.00,400.00,1,2,'kilimani,Nairobi','Nairobi','active','[\"/uploads/67c50cfb9c6703cc6964403374f2e359.png\", \"/uploads/ec01a4978a11f7df12bab7094a711c0d.png\", \"/uploads/e6c149780a1b8ffa0b346cbb83441cf1.png\", \"/uploads/602636882680ca20bb12a1bc35510f4f.png\"]','[\"/uploads/videos/f506cb94fae2a7f2e89a4dd412923b5d.mp4\", \"/uploads/videos/c5557578d2a00c58ec8d582e4b563a57.mp4\"]','2026-02-15 13:08:30','2026-02-15 13:08:30',8,1,1,NULL),(52,12,'Apartment in Kilimani,Nairobi','This modern apartment offers a comfortable and stylish living experience, ideal for individuals, couples, or small families. It features a well-designed layout with spacious, naturally lit rooms, a contemporary kitchen fitted with quality finishes, and a clean, elegant bathroom.','Apartment','rent',21000.00,1500.00,1,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/164d8b87b88b0764d59f56d5d179a176.png\", \"/uploads/5b8f1f4d1ffc67a58468e1a2d38c219f.png\", \"/uploads/2ba09c7316c3e88dccac8ae918b5d467.png\", \"/uploads/db701c8bf3f703e3aae18bcf928dfd04.png\"]','[\"/uploads/videos/df4c2adc02f3d4fca6e70b97de923c11.mp4\", \"/uploads/videos/f0a9517283b2112b5afad8bf2a1cec3e.mp4\"]','2026-02-15 13:13:22','2026-02-15 13:13:22',10,1,1,4),(53,12,'Apartment in Kiliamni,Nairobi','This modern apartment offers a comfortable and stylish living experience, ideal for individuals, couples, or small families. It features a well-designed layout with spacious, naturally lit rooms, a contemporary kitchen fitted with quality finishes, and a clean, elegant bathroom.','Apartment','rent',25000.00,1500.00,2,1,'Kiliamni,Nairobi','Nairobi','active','[\"/uploads/c5ba9cc71f8aafc9777c473e5b9e1c29.png\", \"/uploads/b2bc85b17e6197835487a701eb25a86a.png\", \"/uploads/ba2c06bdadd63c972d5c044e1f05d841.png\", \"/uploads/9a25c657df47ea402d6b7e0a0573d65d.png\"]','[\"/uploads/videos/3be6ede5729ee961f7881d987ffb68de.mp4\", \"/uploads/videos/d260afd589156ffc5becd2f707f0e97d.mp4\"]','2026-02-15 13:13:23','2026-02-15 13:13:23',5,1,1,4),(54,12,'Apartment in Kilimani,Nairobi','This modern apartment offers a comfortable and stylish living experience, ideal for individuals, couples, or small families. It features a well-designed layout with spacious, naturally lit rooms, a contemporary kitchen fitted with quality finishes, and a clean, elegant bathroom.','Apartment','rent',16000.00,1500.00,1,1,'Kilimani,Nairobi','Nairobi','active','[\"/uploads/cfe17c33eeb82d4e0327848255245849.png\", \"/uploads/d0c6b5173afb3c190e70b6cd1c78102c.png\", \"/uploads/d43f8c8fd01fdc50cfb11130839bd3a6.png\", \"/uploads/4f6f9573c931d968863d35270e1e711c.png\"]','[\"/uploads/videos/867ff08a08c49fc70ee2b54d680d3d94.mp4\", \"/uploads/videos/d2e848d7e88264a41e21b9103f8b0e37.mp4\"]','2026-02-15 13:13:24','2026-02-15 13:13:24',10,1,1,4),(55,12,'Apartment in Kilimani, Nairobi','This modern apartment offers a comfortable and stylish living experience, ideal for individuals, couples, or small families. It features a well-designed layout with spacious, naturally lit rooms, a contemporary kitchen fitted with quality finishes, and a clean, elegant bathroom.','Apartment','rent',21000.00,1500.00,1,1,'Kilimani, Nairobi','Nairobi','active','[\"/uploads/4788f90d6ff48557054c39f4ba21cdbf.png\", \"/uploads/b111cded68cfb007578c7e231b8a7f34.png\", \"/uploads/b73e162320bcc2d0c3d5fd06c86d6da3.png\", \"/uploads/d7478f03d3a6571689ddc660bf091345.png\"]','[\"/uploads/videos/788686389d9e75795d83e13c63878850.mp4\", \"/uploads/videos/0cbaa8a2f6b65fe3280346c7dd726995.mp4\"]','2026-02-15 13:13:25','2026-02-15 13:13:25',3,1,1,4),(56,12,'Apartment in Kileleshwa, Nairobi','','Apartment','rent',15000.00,400.00,2,1,'Kileleshwa, Nairobi','Nairobi','active','[\"/uploads/2996b21495b577b0fd8118f019f31fd1.png\", \"/uploads/8fc1f23ed43b9b8aaf1a1d70cddd78c0.png\", \"/uploads/d20b51193d48a905bfa65029e7a25234.png\", \"/uploads/52b14e35b5b5ec670340dcf55d20d6fb.png\"]','[\"/uploads/videos/838ca84e8588ac6c4c5be4a1c1314844.mp4\", \"/uploads/videos/c9e312d2b2dbddf55e6b685d552c8e43.mp4\"]','2026-02-17 13:06:01','2026-02-17 13:06:01',5,1,1,NULL);
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_reviews`
--

DROP TABLE IF EXISTS `property_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `user_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text NOT NULL,
  `review_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `unique_user_property_booking` (`user_id`,`property_id`,`booking_id`),
  KEY `idx_property_reviews_property` (`property_id`,`review_date` DESC),
  KEY `idx_property_reviews_user` (`user_id`),
  CONSTRAINT `property_reviews_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `property_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `property_reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_reviews`
--

LOCK TABLES `property_reviews` WRITE;
/*!40000 ALTER TABLE `property_reviews` DISABLE KEYS */;
INSERT INTO `property_reviews` VALUES (1,8,43,NULL,3,'I love the house','2025-11-12 07:15:12',1,'2025-11-12 07:15:12','2025-11-12 07:15:12'),(2,11,43,NULL,5,'would highly recommend','2025-11-12 07:17:24',1,'2025-11-12 07:17:24','2025-11-12 07:17:24'),(3,9,43,NULL,4,'Would highly recommend','2025-11-12 07:35:29',1,'2025-11-12 07:35:29','2025-11-12 07:35:29'),(4,14,44,NULL,4,'I would highly recommend','2025-11-20 14:58:42',1,'2025-11-20 14:58:42','2025-11-20 14:58:42'),(5,13,44,NULL,4,'Would not recommend','2025-11-20 15:16:31',1,'2025-11-20 15:16:31','2025-11-20 15:16:31'),(6,20,44,NULL,5,'Best house I have seen in days','2025-11-22 07:47:38',1,'2025-11-22 07:47:38','2025-11-22 07:47:38'),(7,20,44,NULL,4,'Would highly recommend','2025-11-22 18:29:46',1,'2025-11-22 18:29:46','2025-11-22 18:29:46'),(8,19,44,NULL,4,'Good','2025-11-23 07:43:48',1,'2025-11-23 07:43:48','2025-11-23 07:43:48'),(9,23,44,NULL,4,'Would highly recommend','2025-11-24 16:21:29',1,'2025-11-24 16:21:29','2025-11-24 16:21:29'),(10,20,44,NULL,4,'Hae','2025-11-25 11:56:26',1,'2025-11-25 11:56:26','2025-11-25 11:56:26'),(11,30,44,NULL,5,'I like the house','2025-12-06 09:06:26',1,'2025-12-06 09:06:26','2025-12-06 09:06:26'),(12,22,44,NULL,5,'i like the house','2025-12-06 16:02:02',1,'2025-12-06 16:02:02','2025-12-06 16:02:02'),(13,36,44,NULL,4,'I like this house','2025-12-21 17:50:33',1,'2025-12-21 17:50:33','2025-12-21 17:50:33'),(14,37,44,NULL,3,'Nice house','2025-12-21 18:56:56',1,'2025-12-21 18:56:56','2025-12-21 18:56:56'),(15,39,44,NULL,5,'I like the house','2026-01-28 15:55:52',1,'2026-01-28 15:55:52','2026-01-28 15:55:52'),(16,41,44,NULL,4,'I  like this house','2026-01-30 14:01:00',1,'2026-01-30 14:01:00','2026-01-30 14:01:00'),(17,46,44,NULL,5,'Hii nyumba inakaa poa sanaa','2026-02-07 18:51:49',1,'2026-02-07 18:51:49','2026-02-07 18:51:49'),(18,46,44,NULL,5,'Hii nyumba inakaa poa sanaa','2026-02-07 18:51:49',1,'2026-02-07 18:51:49','2026-02-07 18:51:49'),(19,48,44,NULL,5,'The house looks good','2026-02-15 12:37:13',1,'2026-02-15 12:37:13','2026-02-15 12:37:13'),(20,52,44,NULL,5,'I liked the house','2026-02-15 19:15:25',1,'2026-02-15 19:15:25','2026-02-15 19:15:25'),(21,12,44,NULL,5,'I like the house','2026-02-18 15:51:06',1,'2026-02-18 15:51:06','2026-02-18 15:51:06'),(22,12,44,NULL,5,'I like the house','2026-02-18 15:51:06',1,'2026-02-18 15:51:06','2026-02-18 15:51:06'),(23,12,44,NULL,5,'I like the house','2026-02-18 15:51:06',1,'2026-02-18 15:51:06','2026-02-18 15:51:06');
/*!40000 ALTER TABLE `property_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int NOT NULL,
  `user_id` int NOT NULL,
  `property_id` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `property_id` (`property_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_searches`
--

DROP TABLE IF EXISTS `saved_searches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_searches` (
  `search_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `search_name` varchar(255) NOT NULL,
  `search_criteria` json NOT NULL,
  `email_alerts` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`search_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `saved_searches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_searches`
--

LOCK TABLES `saved_searches` WRITE;
/*!40000 ALTER TABLE `saved_searches` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_searches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_online_status`
--

DROP TABLE IF EXISTS `user_online_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_online_status` (
  `user_id` int NOT NULL,
  `is_online` tinyint(1) DEFAULT '0',
  `last_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `socket_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_online_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_online_status`
--

LOCK TABLES `user_online_status` WRITE;
/*!40000 ALTER TABLE `user_online_status` DISABLE KEYS */;
INSERT INTO `user_online_status` VALUES (12,0,'2025-12-01 13:14:48',NULL),(17,0,'2025-11-27 09:35:54',NULL),(41,0,'2025-11-22 18:45:53',NULL),(44,0,'2026-02-17 13:02:42',NULL),(52,0,'2026-02-17 13:00:03',NULL),(53,0,'2026-02-17 13:02:09',NULL);
/*!40000 ALTER TABLE `user_online_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','agent','admin') DEFAULT 'user',
  `email_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `account_locked_until` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_verification_token` (`verification_token`),
  KEY `idx_reset_token` (`password_reset_token`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'user@test.com',NULL,'$2a$10$abcdefghijklmnopqrstuvwxyz123456','user',1,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 18:29:55','2025-10-11 18:29:55',NULL),(2,'agent@test.com',NULL,'$2a$10$abcdefghijklmnopqrstuvwxyz123456','agent',1,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 18:29:55','2025-10-11 18:29:55',NULL),(3,'aser@test.com',NULL,'$2b$10$/goxIzVfMcgH0loQJ920VO3j/ddfVRm.vNTxA4F5nkXRxVBu5lkeS','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 18:59:09','2025-10-11 18:59:09',NULL),(4,'ugent@test.com',NULL,'$2b$10$o.x/.CVH8qkRlhP8yBM8VOnZSjdEMWOfdxwsjab3gnKsiqfIvU5tu','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 18:59:56','2025-10-11 18:59:56',NULL),(5,'gent@test.com',NULL,'$2b$10$pnkzzflQgjE9L61KZ/yhze6aNZJ9oEjxpjAHxaqCoXrBaIiObo.MO','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 19:02:58','2025-10-11 19:02:58',NULL),(6,'marlow@test.com',NULL,'$2b$10$xPDZeyHj1uV/6s5d6Qn.8e2uRiEIr12GxaPMVbnRgh6YEuVTY11.K','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 19:07:09','2025-10-11 19:07:09',NULL),(7,'leo@test.com',NULL,'$2b$10$vz5Q2L9G16epKP8UMg85A.xrwp2baTRxKkLIl9Vws3Rx/.285gAwa','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 19:13:48','2025-10-11 19:13:48',NULL),(8,'messi@test.com',NULL,'$2b$10$z2WqBaSQ2t57iatA..pXg.ZpZf1JCqXNsKCaAIyOtLTq7z2ueBqqq','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 19:15:39','2025-10-11 19:15:39',NULL),(9,'testagent999@test.com',NULL,'$2b$10$GwpT6UbVb3OGrcZIGNLnaOnsqCEGh1Bm3M5zYbg1aJZy.EluuHBkW','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-11 19:24:09','2025-10-11 19:24:09',NULL),(10,'ken@test.com',NULL,'$2b$10$UUokZMw6.XyOVXWzsh.j5.cyhnRDGz0LkpH.bEQ6jNshfuABH13Gy','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 08:24:09','2025-10-12 08:24:09',NULL),(11,'James@test.com',NULL,'$2b$10$6ZIqrjKB8mTHYoLTjai.ouzPpGP4Tfo/slXsztxXrdG3vRMDN1.BG','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 08:24:54','2025-10-12 08:24:54',NULL),(12,'kamausammy161@gmail.com',NULL,'$2b$10$M0BnFrMk051xSjPjmC7Elu177zalBR7TdiVyepSw/La9jLxEdN.NC','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 08:27:59','2025-10-12 08:27:59',NULL),(13,'kamasammy161@gmail.com',NULL,'$2b$10$ngG60mCtU8Xaw90B/Ckf2e/4dlpCqbm6CDZMiHF6h49alU0nLdgrC','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 08:41:45','2025-10-12 08:41:45',NULL),(14,'amausammy161@gmail.com',NULL,'$2b$10$DEBlwXQfgSK/iF.usGOvduG1Fgrs0NP1A4SbuuDlk0urEg10/yIp2','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 08:47:27','2025-10-12 08:47:27',NULL),(15,'annetheuri382@gmail.com',NULL,'$2b$10$brrIhtulXmQsgtWE4NiRHO6itRcam68DhGOjBB45tPuyi2qlVNGxG','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 19:58:10','2025-10-12 19:58:10',NULL),(16,'today@gmail.com',NULL,'$2b$10$LTL56.aAofvaRG0mNlpsCeOZuzV4PwA8R.vVNja7rn9ajTMQEfrQm','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 20:00:43','2025-10-12 20:00:43',NULL),(17,'sammy161@gmail.com',NULL,'$2b$10$FUWWU7pCKob6RSCigsmbd.yEgUN1QkHJUAI46fJJQwgTA4wSJzdqS','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 20:02:13','2025-10-12 20:02:13',NULL),(18,'kamau161@gmail.com',NULL,'$2b$10$XGpkDHXOx4NppN.eK8c7OuYKT9uRNHgPaXRAmW1NtOVpz82JkN7jW','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 20:12:39','2025-10-12 20:12:39',NULL),(19,'kama161@gmail.com',NULL,'$2b$10$mcNgCIQFeF2DOr2LOPmxuOTlQh4U7Wd92QOsxloX/zxP.aqcP/jeS','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-12 20:17:11','2025-10-12 20:17:11',NULL),(20,'mmy161@gmail.com',NULL,'$2b$10$sIXRc.KAk9wf2gGJrAVe0e574uoRlIpTrrQ3VXqS.GW/.0x2mSR9u','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:12:54','2025-10-13 07:12:54',NULL),(21,'mummy161@gmail.com',NULL,'$2b$10$QaOSV65bTo8KjenxIhfCoeEA/U0BjPlQQc8DmiCERk5cC4IVvJD3O','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:16:53','2025-10-13 07:16:53',NULL),(22,'Kimmy161@gmail.com',NULL,'$2b$10$U37T7Fl/WhNLPYaKrr4kK.qpGiB60g2aC/UjDXUrsH9w3yN3xxupi','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:31:43','2025-10-13 07:31:43',NULL),(23,'Kammy161@gmail.com',NULL,'$2b$10$uGvia9HuB.0L6T/tKvGrs.aPPyNAmc5V7L6leRgHh13KVyhlkRp0y','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:34:16','2025-10-13 07:34:16',NULL),(24,'skills@gmail.com',NULL,'$2b$10$bBjN4T72CAARwrC7lcc8fO7dmxSppSKLLH7/ABnHKPLe/Nc4xDctm','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:36:34','2025-10-13 07:36:34',NULL),(25,'manage@gmail.com',NULL,'$2b$10$mYxMNvw4Dz55YZuQOJm80.SJX2cX0ERjCtf2x0oAZIwpIT5DTpbsS','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 07:40:03','2025-10-13 07:40:03',NULL),(26,'young@gmail.com',NULL,'$2b$10$b1zE//czUwQggaSn62thduJW5y/xKPpeKlDAUTThrj.iyni62NSSy','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 18:12:20','2025-10-13 18:12:20',NULL),(27,'kelly@gmail.com',NULL,'$2b$10$MG2yXEmoN3dYqcMuZwmA3uXCDOAL/T/mMxlAXmWuajXY4swDfO4Z.','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 18:17:26','2025-10-13 18:17:26',NULL),(28,'mmy@gmail.com',NULL,'$2b$10$htJuDHzCbXU.RGDRDXsljOSb.pdhCJkm/BCiKXY7vNUW9j.WYEjJW','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 18:19:06','2025-10-13 18:19:06',NULL),(29,'Toda@gmail.com',NULL,'$2b$10$TXlJlHQButQdgieXGvcy..o/cz3BXXEUWXnRSPsdlesQOm9TYVuli','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 18:22:33','2025-10-13 18:22:33',NULL),(30,'tred@gmail.com',NULL,'$2b$10$m7QGpOH37GwJs885QcqyNerPzOcRFzeHuzDV5Hzd1E/paO95HPs0i','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 18:28:52','2025-10-13 18:28:52',NULL),(31,'saisiduncan99@gmail.com',NULL,'$2b$10$g4ntsmAnrNz9oy02fJuR6.jeb84/hWuS.nA7fW0KiiF39prHqMmfK','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 19:00:47','2025-10-13 19:00:47',NULL),(32,'dont@gmail.com',NULL,'$2b$10$CWhUATFFFQMV2aB8iHz86.7R0CEgPNPapojCg4wpBXZUbsx5kP3OW','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 19:05:43','2025-10-13 19:05:43',NULL),(33,'Here@gmail.com',NULL,'$2b$10$/fjW0vpW6Yemc48.6P8Ojuq8JtajH5niMsCY6GJLryIQ8i19g4.va','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-13 19:37:45','2025-10-13 19:37:45',NULL),(34,'problem@gmail.com',NULL,'$2b$10$5e0S5syXDqju/Cw0JwV1q.JCNKygk0RUchhvOGM3hu3zP/G9JzVpS','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-15 17:48:32','2025-10-15 17:48:32',NULL),(35,'fixed@gmail.com',NULL,'$2b$10$iPL/uGk7mmRFDBqYkkr3ru8aV3Q.xCunp9ot5ClpsWSGE1xQqo2d2','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-15 19:07:13','2025-10-15 19:07:13',NULL),(36,'email@gmail.com',NULL,'$2b$10$rA7fv7rGfQLHsJ12glOzGO859Adj8DJai7GRlnTc2SEr/3GpzFEyC','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-16 07:10:50','2025-10-16 07:10:50',NULL),(37,'agenttest@example.com',NULL,'$2b$10$0jov/tpW2mqqkE7etaPj9eHm6Hp.jEx8bF8LNCc6IyRiMWIXVzk7e','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-16 08:16:39','2025-10-16 08:16:39',NULL),(38,'agenttester@example.com',NULL,'$2b$10$jK.ea1Tdtjx7hFRVMYdISOU.h58qgMmJf3o7JGhPvPtA1um4UnC8q','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-16 08:20:55','2025-10-16 08:20:55',NULL),(39,'agenttestey@example.com',NULL,'$2b$10$.l2oZRd.8O2teXR.Iu6hhOLPpD2WPIOySWtSvXNK1si/soJ8YM0my','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-16 08:21:41','2025-10-16 08:21:41',NULL),(40,'travel161@gmail.com',NULL,'$2a$10$xMA0PC7WRPMS7Brib35Rs.xK5F1rJ2po2QDl3Gu154AgEhpS5fbVW','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-18 07:26:41','2025-10-18 07:26:41',NULL),(41,'Marlowgood2025@gmail.com',NULL,'$2a$10$MlLLr8jo6AEJOT9HkHIh.usGMe0CXUJdzkTE64cq618VXSP4ubH76','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2025-10-21 15:36:01','2025-10-21 15:36:01',NULL),(42,'homeloop@gmail.com',NULL,'$2a$10$XRago4M74xkT9ZxaZ6pmb./nVsJ93odVS7B/sFOkIbwsMlgLiWuAi','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-11 10:08:54','2025-11-11 10:08:54',NULL),(43,'j26-8180-2021@student.mksu.ac.ke','Student','$2a$10$EqWHVF2ABIAiDI0ErDc0fOUc9pUNhGr9ibwjR5Wc8l7CezyeUY6qq','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-12 07:14:18','2025-11-12 07:14:18',NULL),(44,'ruth@gmail.com','Ruth','$2a$10$nk4UUVYDc3k/L7hj9wkxzeSJ6qK6Otbc4.xjB41GzrF2eubWGEsNq','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-14 11:01:56','2025-11-14 11:01:56',NULL),(45,'aira@gmail.com','Aira','$2a$10$xBemLxWxFjc6QYPn/omyp.bVYfJyAukEWwiOjkfXqWa7PujqrN0ti','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 12:51:14','2025-11-24 12:51:14',NULL),(46,'jaira@gmail.com','jaira','$2a$10$grMBKQuLnWlTjxLUKIizQuJD8TixP6p5r3G/gICJsXalJoDux9MuO','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 12:52:40','2025-11-24 12:52:40',NULL),(47,'Kaira@gmail.com','Kaira','$2a$10$04jVIihUMByqKSWDZl5bFeOCeLL/E/5Pjx7KQjpJ3kiqtE19ym2DC','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 12:56:41','2025-11-24 12:56:41',NULL),(48,'Caira@gmail.com','Caira','$2a$10$2DB.akKD8ooCA8/3LTumM.ZK8c2Ax.N1/CsCP0BiQRvcPMtBCtJFm','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 12:57:20','2025-11-24 12:57:20',NULL),(49,'june@gmail.com','June','$2a$10$z3GXjMOtTrBLtLSqJd3f3.hGyJXMSnawEVEzwWERWAnG.DvWHzAwW','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 12:58:21','2025-11-24 12:58:21',NULL),(50,'anne@gmail.com','Anne','$2a$10$GuOMsQ9CGe9DTYkps9z0ROta1FCx8L87nR.c7D/l/IkSaSoaCeTca','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-11-24 13:00:56','2025-11-24 13:00:56',NULL),(51,'create@gmail.com','create','$2a$12$Y6sDNJdm9gjJeZQb3n6ADex0LldbYjVQKhfJU/U7.X7ex2C6wtGkO','user',0,NULL,NULL,NULL,0,NULL,NULL,'2025-12-05 20:11:03','2025-12-05 20:11:03',NULL),(52,'test@gmail.com','Test','$2a$12$FBZwXoTgalzAYHVpS..8jeacfOwSXbZ19h7BW6Fyrnphp9BNwPg9m','user',0,NULL,NULL,NULL,0,NULL,NULL,'2026-02-17 12:59:16','2026-02-17 12:59:16',NULL),(53,'account@gmail.com','Account','$2a$12$VenwkDa0hh1U93ZmhTIureCGdklNCBcOjrmEUU85lnzQ.p6pPDH1a','user',0,NULL,NULL,NULL,0,NULL,NULL,'2026-02-17 13:01:44','2026-02-17 13:01:44',NULL),(54,'homeloopbuild20@gmail.com','Great','$2a$12$6lnGnRBj0YPuENxRB.aVn.lPrCxFc.xUtD5Au46LsZETGg/z6An1q','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2026-02-19 13:12:29','2026-02-19 13:12:29',NULL),(55,'homeloopbuilders20@gmail.com','Marlow','$2a$12$v/tj7ZCSiTXrrxQoXXorI.XCXJMZChpkUi4RGot0pW0vYSKVpjz1G','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2026-02-19 13:14:51','2026-02-19 13:14:51',NULL),(56,'nderisammy30@gmail.com','Nderi','$2a$12$6QxRGbdmTfndVJrCN0wTSux9vgZCOGQygko15h3EiERCO9uDd8R/m','agent',0,NULL,NULL,NULL,0,NULL,NULL,'2026-02-19 13:18:03','2026-02-19 13:18:03',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `payment_summary`
--

/*!50001 DROP VIEW IF EXISTS `payment_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `payment_summary` AS select `pt`.`id` AS `id`,`pt`.`property_id` AS `property_id`,`p`.`title` AS `property_title`,`pt`.`agent_id` AS `agent_id`,`a`.`full_name` AS `agent_name`,`pt`.`amount` AS `amount`,`pt`.`phone_number` AS `phone_number`,`pt`.`mpesa_receipt` AS `mpesa_receipt`,`pt`.`status` AS `status`,`pt`.`created_at` AS `created_at`,`pt`.`updated_at` AS `updated_at` from ((`payment_transactions` `pt` left join `properties` `p` on((`pt`.`property_id` = `p`.`property_id`))) left join `agents` `a` on((`pt`.`agent_id` = `a`.`user_id`))) order by `pt`.`created_at` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-10 10:45:51
