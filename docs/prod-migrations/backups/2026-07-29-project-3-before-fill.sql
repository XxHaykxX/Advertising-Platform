-- MySQL dump 10.13  Distrib 8.4.9, for Linux (x86_64)
--
-- Host: srv2026.hstgr.io    Database: u998961932_advertising
-- ------------------------------------------------------
-- Server version	11.8.8-MariaDB-log

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
-- Dumping data for table `Project`
--
-- WHERE:  id=3

LOCK TABLES `Project` WRITE;
/*!40000 ALTER TABLE `Project` DISABLE KEYS */;
INSERT INTO `Project` VALUES (3,'#PP-2026-2384','Валдакар','Վալդակար','Валдакар','Valdakar','Animation','Добрая анимационная история для самых маленьких зрителей следует за любопытным юным героем сквозь красочный фэнтезийный мир дружелюбных существ и маленьких уроков. Каждая серия — новое приключение о доброте и смелости.','Անին ու Արամը պատահաբար արթնացնում են կախարդական քարի մեջ ննջող Գրիգոր Մագիստրոսին։ Այս արտասովոր հանդիպումը սկիզբ է դնում ֆանտաստիկ մի շրջանի, երբ երեխաները Մագիստրոսին ցույց են տալիս 21-րդ դարի հրաշալիքները, իսկ նա՝ գրքերի միջոցով նրանց տանում է ժամանակի միջով արկածների։ Յուրաքանչյուր ճամփորդություն նոր բացահայտում է. նրանք հայտնվում են Թումանյանի հեքիաթների աշխարհում, Համբարձումյանի հետ նայում աստղերին և Թամանյանի հետ գծագրում ապագայի Երևանը՝ ամեն անգամ քաղելով կյանքի ամենակարևոր դասերը։','Добрая анимационная история для самых маленьких зрителей следует за любопытным юным героем сквозь красочный фэнтезийный мир дружелюбных существ и маленьких уроков. Каждая серия — новое приключение о доброте и смелости.','A gentle animated adventure for the youngest viewers follows a curious young hero through a colorful fantasy world of friendly creatures and small lessons. Every episode is a new quest about kindness and courage.','/uploads/projects/1784800240000-7bbfaf87.webp','[\"/uploads/projects/1784800410450-5ed97624.webp\",\"/uploads/projects/1784800370425-5f81f6ac.webp\",\"/uploads/projects/1784800382489-89a754b4.webp\",\"/uploads/projects/1784800388613-596c856f.webp\",\"/uploads/projects/1784800394794-e5b67db4.webp\",\"/uploads/projects/1784800402348-b3151f75.webp\"]','','Kinodaran','POST_PRODUCTION','Georgia, USA, Russia, Armenia',1,0,'2026-07-08 20:31:49.680',1,'2026-09-15 00:00:00.000','2026-08-11 00:00:00.000','[\"Kinodaran\"]',NULL,'[]','Քույր ու եղբայր Մագիստրոսի հետ ճամփորդում են տարբեր աշխարհներով՝ կյանքի կարևոր դասեր քաղելով պատմության ամենաազդեցիկ հայերից:','',30,10,'[\"Animation\",\"Adventure\"]','SERIAL','APPROVED','','Armenian','Քույր ու եղբայր Մագիստրոսի հետ ճամփորդում են տարբեր աշխարհներով՝ կյանքի կարևոր դասեր քաղելով պատմության ամենաազդեցիկ հայերից:',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,50000000,7);
/*!40000 ALTER TABLE `Project` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-28 21:09:33
-- MySQL dump 10.13  Distrib 8.4.9, for Linux (x86_64)
--
-- Host: srv2026.hstgr.io    Database: u998961932_advertising
-- ------------------------------------------------------
-- Server version	11.8.8-MariaDB-log

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
-- Dumping data for table `ProductionMilestone`
--
-- WHERE:  projectId=3

LOCK TABLES `ProductionMilestone` WRITE;
/*!40000 ALTER TABLE `ProductionMilestone` DISABLE KEYS */;
INSERT INTO `ProductionMilestone` VALUES (37,3,'Post Production','2025-12-11 00:00:00.000','',0,0),(38,3,'production','2025-07-12 00:00:00.000','',1,1);
/*!40000 ALTER TABLE `ProductionMilestone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `Actor`
--
-- WHERE:  projectId=3

LOCK TABLES `Actor` WRITE;
/*!40000 ALTER TABLE `Actor` DISABLE KEYS */;
INSERT INTO `Actor` VALUES (298,3,'Ռաֆայել Թադևոսյան','Պրոդյուսեր',0,'CAST','/uploads/actors/1784805046566-fdea029a.webp',2,'[\"Պրոդյուսեր\",\"Writer\",\"Animator\",\"Line Producer\",\"Host\",\"Creative Producer\",\"Guest\",\"Performer\",\"Voice Actor\",\"Executive Producer\",\"General Producer\",\"Show Host\",\"Showrunner\",\"Music\",\"Producer\",\"Director\",\"Actor\"]','Ռաֆայել Թադևոսյան','Рафаэль Тадевосян','Rafayel Tadevosyan');
/*!40000 ALTER TABLE `Actor` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-28 21:09:36
