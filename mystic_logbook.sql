-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 16 Mar 2026, 14:56:12
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `mystic_logbook`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` varchar(36) NOT NULL,
  `type` enum('info','warning','success','error','comment','message') NOT NULL DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_read` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` varchar(36) DEFAULT NULL,
  `entity_title` varchar(500) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_categories`
--

CREATE TABLE `blog_categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `blog_categories`
--

INSERT INTO `blog_categories` (`id`, `name`, `slug`, `description`, `icon`, `order_index`, `created_at`, `updated_at`) VALUES
('2bc7b00b-edea-48a9-8155-9eaf7d703ec9', 'test', 'test', NULL, NULL, 0, '2026-02-16 18:06:41', '2026-02-16 18:06:41');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_comments`
--

CREATE TABLE `blog_comments` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 1,
  `like_count` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_comment_likes`
--

CREATE TABLE `blog_comment_likes` (
  `id` varchar(36) NOT NULL,
  `comment_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_likes`
--

CREATE TABLE `blog_likes` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `slug` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `excerpt` text DEFAULT NULL,
  `author_id` varchar(36) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `scheduled_at` datetime DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `view_count` int(11) DEFAULT 0,
  `like_count` int(11) DEFAULT 0,
  `meta_title` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_subscribers`
--

CREATE TABLE `blog_subscribers` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(100) DEFAULT NULL,
  `subscribed_at` datetime DEFAULT NULL,
  `unsubscribed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `blog_subscribers`
--

INSERT INTO `blog_subscribers` (`id`, `email`, `name`, `is_verified`, `verification_token`, `subscribed_at`, `unsubscribed_at`, `created_at`, `updated_at`) VALUES
('6b1337f4-9f2a-4028-9570-b0c055646d02', 'subscriber-1771229099301@example.com', 'Newsletter Subscriber', 0, 'ffedb6f2-1b32-4489-adc9-660d9267d6b6', '2026-02-16 11:04:59', NULL, '2026-02-16 11:04:59', '2026-02-16 11:04:59'),
('75601d26-8838-4a33-b27c-83e3cf3d5e41', 'subscriber-1771254139048@example.com', 'Newsletter Subscriber', 0, 'bcb0fa86-8797-4411-99eb-afeac171d872', '2026-02-16 18:02:19', NULL, '2026-02-16 18:02:19', '2026-02-16 18:02:19'),
('883b3f9d-32aa-47db-aef9-976f958be99a', 'subscriber-1772027866554@example.com', 'Newsletter Subscriber', 0, '778e5b15-7486-408f-9bf3-b89daaf32519', '2026-02-25 16:57:46', NULL, '2026-02-25 16:57:46', '2026-02-25 16:57:46'),
('ccf27c5f-af83-470f-88b8-b15b9c17a7e1', 'subscriber-1772027805342@example.com', 'Newsletter Subscriber', 0, 'd9dc1a8b-aedb-400e-b9d8-d4834b428129', '2026-02-25 16:56:45', NULL, '2026-02-25 16:56:45', '2026-02-25 16:56:45'),
('de7bfd4a-42ed-4c29-a29e-b4957637ac46', 'subscriber-1772027882453@example.com', 'Newsletter Subscriber', 0, 'ba4fc9ee-7fc6-49e3-9e8a-907910bcb2ba', '2026-02-25 16:58:02', NULL, '2026-02-25 16:58:02', '2026-02-25 16:58:02');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `categories`
--

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `parent_id`, `order_index`, `created_at`, `updated_at`) VALUES
('004d0e31-8525-46d3-80ff-e0052360bff9', 'Renkler', 'renkler', 'Renklerle ilgili rüya tabirleri', 'palette', NULL, 6, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('1ceb448d-d416-48d9-8283-872fac918f07', 'Durumlar', 'durumlar', 'Çeþitli durumlar ve olaylarla ilgili rüya tabirleri', 'theater', NULL, 5, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('2ab1eecb-ad45-459b-83c3-0edef917aa0f', 'Kişiler', 'kisiler', 'Kişiler ve ilişkilerle ilgili rüya tabirleri', 'users', NULL, 4, '2026-02-16 10:14:37', '2026-02-25 17:31:24'),
('36df06f1-7f80-4f1e-a5e4-77ce24dfe942', 'Hayvanlar', 'hayvanlar', 'Hayvanlarla ilgili rüya tabirleri', 'paw', NULL, 1, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('47d6565a-2c7b-4380-bed6-48848578a36b', 'Nesneler', 'nesneler', 'Çeþitli nesnelerle ilgili rüya tabirleri', 'box', NULL, 3, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('49767b7a-7c91-49b5-9ddc-ea5c3b111a89', 'Vahşi Hayvanlar', 'vahsi-hayvanlar', 'Vahşi hayvanlarla ilgili rüya tabirleri', 'lion', '36df06f1-7f80-4f1e-a5e4-77ce24dfe942', 3, '2026-02-16 10:14:37', '2026-02-25 17:30:09'),
('5a4e903b-fad9-4158-8c56-d8f57827f5e3', 'Toprak', 'toprak', 'Toprak ile ilgili rüya tabirleri', 'earth', '785d3e55-18e8-4e5c-819f-9ebce2d37bef', 4, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('68e9038f-6e8e-4bed-8922-830b8879409f', 'Yiyecekler', 'yiyecekler', 'Yiyecek ve içeceklerle ilgili rüya tabirleri', 'apple', NULL, 8, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('712c188b-24a8-4d67-b9db-a61780d5a50b', 'Ateş', 'ates', 'Ateş ile ilgili rüya tabirleri', 'fire', '785d3e55-18e8-4e5c-819f-9ebce2d37bef', 3, '2026-02-16 10:14:37', '2026-02-25 17:29:52'),
('76322546-f026-44d8-bf54-51f7184bf70b', 'Su', 'su', 'Su ile ilgili rüya tabirleri', 'water', '785d3e55-18e8-4e5c-819f-9ebce2d37bef', 2, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('785d3e55-18e8-4e5c-819f-9ebce2d37bef', 'Doğa', 'doga', 'Doğa olayları ve elementleri ile ilgili rüya tabirleri', 'leaf', NULL, 2, '2026-02-16 10:14:37', '2026-02-25 17:29:34'),
('b2704e46-3a19-4067-94a9-a4dd88c1f8a9', 'Kuşlar', 'kuslar', 'Kuþlarla ilgili rüya tabirleri', 'bird', '36df06f1-7f80-4f1e-a5e4-77ce24dfe942', 1, '2026-02-16 10:14:37', '2026-02-16 10:40:33'),
('daecc1ff-dcea-46e7-ae72-155e3c44d2c8', 'Deniz Canlıları', 'deniz-canlilari', 'Deniz canlılarıyla ilgili rüya tabirleri', 'fish', '36df06f1-7f80-4f1e-a5e4-77ce24dfe942', 4, '2026-02-16 10:14:37', '2026-02-25 17:30:32'),
('e3ec6792-5515-4538-82c3-652820edaf9a', 'Sayılar', 'sayilar', 'Sayılarla ilgili rüya tabirleri', 'numbers', NULL, 7, '2026-02-16 10:14:37', '2026-02-25 17:31:00'),
('e5608235-ee62-4500-a204-92fcb226152b', 'Evcil Hayvanlar', 'evcil-hayvanlar', 'Evcil hayvanlarla ilgili rüya tabirleri', 'dog', '36df06f1-7f80-4f1e-a5e4-77ce24dfe942', 2, '2026-02-16 10:14:37', '2026-02-16 10:14:37');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `comments`
--

CREATE TABLE `comments` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `dream_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 1,
  `like_count` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` varchar(36) NOT NULL,
  `comment_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `subject`, `message`, `is_read`, `created_at`) VALUES
('167c2a83-10d0-4a09-80c4-0f6507413cce', 'Test User', 'test@example.com', 'Test Subject', 'This is a test message.', 0, '2026-02-16 11:04:59'),
('20293b3e-8287-4bbf-894d-f002b3b0e1ab', 'Test User', 'invalid-email', 'Test Subject', 'Test message', 0, '2026-02-16 11:04:59'),
('2c4bf4d7-4434-40bf-a0b7-c84e00d0b67c', 'Contact Test User', 'contacttest@example.com', 'Test Subject', 'This is a test contact form submission.', 0, '2026-02-25 16:58:03'),
('33a071c0-9001-4b91-a898-d0c73f99e5b2', 'Test User', 'test@example.com', 'Test Subject', 'This is a test message.', 0, '2026-02-25 16:52:50'),
('61925c37-93f9-4aba-893c-77d81bb6af38', 'Test User', 'test@example.com', 'Test Subject', 'This is a test message.', 0, '2026-02-16 18:02:16'),
('634fc4ee-404d-4c49-a21d-c38b5faad3d6', 'Contact Test User', 'contacttest@example.com', 'Test Subject', 'This is a test contact form submission.', 0, '2026-02-16 18:02:16'),
('63e140ca-b88d-40bf-933a-60c5641ce032', 'Contact Test User', 'contacttest@example.com', 'Test Subject', 'This is a test contact form submission.', 0, '2026-02-25 16:56:45'),
('860acccb-cb7c-4816-9f51-cc6a18b15b3b', 'Test User', 'invalid-email', 'Test Subject', 'Test message', 0, '2026-02-25 16:53:02'),
('956b6369-0463-4888-a8fe-522e2ffe0d9f', 'Contact Test User', 'contacttest@example.com', 'Test Subject', 'This is a test contact form submission.', 0, '2026-02-16 11:04:59'),
('b7ed6cdd-e60c-44f1-930d-9f98b0abeb32', 'Test User', 'invalid-email', 'Test Subject', 'Test message', 0, '2026-02-16 18:02:16'),
('c2da1ac9-c2dc-4ec0-9071-64288215ff38', 'Test User', 'invalid-email', 'Test Subject', 'Test message', 0, '2026-02-25 16:53:59'),
('c57c3201-a0c5-4aa5-a4f3-de7bb8d4ec7d', 'Test User', 'invalid-email', 'Test Subject', 'Test message', 0, '2026-02-25 16:52:50'),
('d87376b5-e09b-4cc1-b766-cc85d91cc38d', 'Contact Test User', 'contacttest@example.com', 'Test Subject', 'This is a test contact form submission.', 0, '2026-02-25 16:57:48'),
('dc7a6807-1bfa-40c0-8ce1-ed4dfd6f3139', 'Test User', 'test@example.com', 'Test Subject', 'This is a test message.', 0, '2026-02-25 16:53:59'),
('ece4b1b1-ee36-4f07-9c5d-e8aaf5a0b916', 'Test User', 'test@example.com', 'Test Subject', 'This is a test message.', 0, '2026-02-25 16:53:02');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `dreams`
--

CREATE TABLE `dreams` (
  `id` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `slug` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `islamic_interpretation` longtext DEFAULT NULL,
  `psychological_interpretation` longtext DEFAULT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`keywords`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `view_count` int(11) DEFAULT 0,
  `like_count` int(11) DEFAULT 0,
  `meta_title` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `dreams`
--

INSERT INTO `dreams` (`id`, `title`, `slug`, `content`, `category_id`, `islamic_interpretation`, `psychological_interpretation`, `keywords`, `is_featured`, `is_published`, `view_count`, `like_count`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
('06737c67-0649-4fd4-9349-3574e8b60b07', 'Rüyada Bebek Görmek', 'ruyada-bebek-gormek', 'Rüyada bebek görmek, masumiyeti, yeni baþlangýçlarý ve potansiyeli temsil eder. Gülen bir bebek görmek, mutlu haberler ve güzel geliþmeler anlamýna gelir. Aðlayan bebek, dikkat edilmesi gereken konulara iþaret edebilir. Bebek bakmak, sorumluluk ve koruma içgüdüsünü gösterir.', '2ab1eecb-ad45-459b-83c3-0edef917aa0f', 'Ýslam alimlerine göre bebek görmek hayýrlýdýr. Bebek, sevinç ve mutluluk haberinin müjdecisidir. Güzel bir bebek görmek, hayýrlý rýzka ve berekete iþarettir. Bebek kucaða almak, sevinçli bir haber almak demektir.', 'Bebek rüyasý, kiþinin iç dünyasýndaki masumiyeti ve yeni potansiyelleri yansýtýr. Bebek görmek, yeni bir projenin veya fikrin doðuþunu temsil eder. Bebeðe bakmak, kiþinin koruyucu ve besleyici yönünü gösterir.', '[\"bebek\",\"masumiyet\",\"yeni baþlangýç\",\"potansiyel\",\"sevinç\"]', 0, 1, 1455, 118, 'Rüyada Bebek Görmek - Ruya Tabiri', 'Rüyada bebek görmek, masumiyeti, yeni baþlangýçlarý ve potansiyeli temsil eder. Gülen bir bebek görmek, mutlu haberler ve güzel geliþmeler anlamýna gelir. Aðlay...', '2026-02-16 10:14:37', '2026-02-25 16:58:01'),
('3ec38a4b-3ab9-4461-804c-560ce2d99ae5', 'Rüyada Nehir Görmek', 'ruyada-nehir-gormek', 'Rüyada nehir görmek, hayatýn akýþýný, deðiþimi ve yolculuðu temsil eder. Berrak bir nehir görmek, hayatýn güzel akacaðýna ve hedeflere ulaþýlacaðýna iþaret eder. Nehirde yüzmek, hayatýn akýþýna uyum saðlamayý gösterir. Nehrin taþmasý, beklenmedik geliþmelere delalettir.', '76322546-f026-44d8-bf54-51f7184bf70b', 'Ýslam tabirlerinde nehir, rýzkýn ve hayatýn akýþýný temsil eder. Berrak nehir, helal rýzýk ve hayýrlý ömür anlamýna gelir. Nehirden su içmek, faydalý ilim ve hayýrlý rýzka iþarettir. Nehrin kurumasý, rýzkýn kesilmesine delalettir.', 'Nehir rüyasý, kiþinin hayat yolculuðunu ve ilerleyiþini yansýtýr. Nehrin akýþý, kiþinin hayatýndaki deðiþimleri temsil eder. Berrak nehir, zihinsel berraklýðý; bulanýk nehir ise kafa karýþýklýðýný gösterir.', '[\"nehir\",\"akýþ\",\"deðiþim\",\"yolculuk\",\"hayat\"]', 0, 1, 920, 76, 'Rüyada Nehir Görmek - Ruya Tabiri', 'Rüyada nehir görmek, hayatýn akýþýný, deðiþimi ve yolculuðu temsil eder. Berrak bir nehir görmek, hayatýn güzel akacaðýna ve hedeflere ulaþýlacaðýna iþaret eder...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('531cc1aa-7000-4286-9e3f-6b42ff92b028', 'Rüyada Köpek Görmek', 'ruyada-kopek-gormek', 'Rüyada köpek görmek, sadakat, dostluk ve korumayý temsil eder. Sevimli bir köpek görmek, sadýk bir arkadaþýnýzýn olduðunu gösterir. Köpeðin havlamasý, uyarý veya haber anlamýna gelebilir. Saldýrgan bir köpek, düþmanlýk veya tehlike iþaretidir.', 'e5608235-ee62-4500-a204-92fcb226152b', 'Ýslam tabirlerinde köpek, çeþitli anlamlara gelir. Köpek görmek bazen düþmaný, bazen de sadýk bir hizmetkarý temsil eder. Köpeðin ýsýrmasý, bir düþmandan zarar görmeye iþarettir. Köpek beslemek, koruma ve güvenlik anlamýna gelir.', 'Köpek rüyasý, kiþinin sosyal iliþkilerini ve güven duygusunu yansýtýr. Sadýk bir köpek, güvenilir arkadaþlarýn varlýðýný gösterir. Saldýrgan köpek ise hayattaki tehditleri veya iç çatýþmalarý temsil eder.', '[\"köpek\",\"sadakat\",\"dostluk\",\"koruma\",\"uyarý\"]', 1, 1, 1540, 112, 'Rüyada Köpek Görmek - Ruya Tabiri', 'Rüyada köpek görmek, sadakat, dostluk ve korumayý temsil eder. Sevimli bir köpek görmek, sadýk bir arkadaþýnýzýn olduðunu gösterir. Köpeðin havlamasý, uyarý vey...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('5d791a1e-c901-475c-a182-a712a7ab796c', 'Rüyada Uçmak', 'ruyada-ucmak', 'Rüyada uçmak, özgürlüðü, yükseliþi ve hedeflere ulaþmayý temsil eder. Yükseðe uçmak, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. Düþmekten korkmadan uçmak, özgüvenin ve cesaretin göstergesidir. Kanatlarla uçmak, manevi yükseliþi temsil eder.', '1ceb448d-d416-48d9-8283-872fac918f07', 'Ýslam tabirlerinde uçmak, yükselmeye ve makam kazanmaya iþarettir. Uçmak, kiþinin durumunun iyileþeceðine ve zorluklardan kurtulacaðýna delalettir. Kuþ gibi uçmak, seyahate veya manevi yükseliþe iþaret edebilir.', 'Uçma rüyasý, kiþinin özgürlük arzusunu ve sýnýrlarý aþma isteðini yansýtýr. Uçmak, kiþinin potansiyelinin farkýna varmasýný ve kendini aþmasýný temsil eder. Yükseðe uçmak, kiþisel geliþim ve baþarý arzusunu gösterir.', '[\"uçmak\",\"özgürlük\",\"yükseliþ\",\"baþarý\",\"hedef\"]', 1, 1, 1980, 156, 'Rüyada Uçmak - Ruya Tabiri', 'Rüyada uçmak, özgürlüðü, yükseliþi ve hedeflere ulaþmayý temsil eder. Yükseðe uçmak, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. Düþmekten ...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('6e792149-d28a-4d58-93ed-6379cc6d2fb0', 'Rüyada Güvercin Görmek', 'ruyada-guvercin-gormek', 'Rüyada güvercin görmek, barýþ, huzur ve sevginin habercisidir. Beyaz bir güvercin görmek, manevi temizliði ve saflýðý temsil eder. Rüyada güvercinlerin uçtuðunu görmek, güzel haberler alacaðýnýza iþaret eder. Güvercin beslemek, aile içi huzurun ve mutluluðun artacaðýný gösterir.', 'b2704e46-3a19-4067-94a9-a4dd88c1f8a9', 'Ýslam alimlerine göre, rüyada güvercin görmek hayýrlýdýr. Güvercin, mümin kiþiyi temsil eder. Beyaz güvercin, saliha bir eþ veya hayýrlý bir evlat anlamýna gelir. Güvercin sesi duymak, güzel haberler almaya iþarettir.', 'Psikolojik açýdan güvercin, iç huzurun ve barýþýn sembolüdür. Rüyada güvercin görmek, kiþinin hayatýnda barýþ ve uyum aradýðýný gösterir. Stresli bir dönemden sonra huzura kavuþacaðýnýzýn müjdesidir.', '[\"güvercin\",\"kuþ\",\"barýþ\",\"huzur\",\"haber\"]', 1, 1, 1250, 89, 'Rüyada Güvercin Görmek - Ruya Tabiri', 'Rüyada güvercin görmek, barýþ, huzur ve sevginin habercisidir. Beyaz bir güvercin görmek, manevi temizliði ve saflýðý temsil eder. Rüyada güvercinlerin uçtuðunu...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('7448c304-fcc8-4763-bbfe-870ddf4d53a7', 'Rüyada Ölü Görmek', 'ruyada-olu-gormek', 'Rüyada ölü görmek, geçmiþle baðlantýyý, biten bir dönemi veya manevi mesajlarý temsil eder. Ölen bir yakýnýnýzý görmek, onun için dua etmeniz gerektiðine iþaret edebilir. Ölüyle konuþmak, önemli mesajlar alýnacaðýna delalettir. Ölen birinin dirilmesi, unutulan bir konunun tekrar gündeme gelmesini gösterir.', '2ab1eecb-ad45-459b-83c3-0edef917aa0f', 'Ýslam tabirlerinde ölü görmek, genellikle hayýrlýdýr. Ölü, dünya iþlerinden el etek çekmiþ kiþiyi temsil eder. Ölüyle konuþmak, doðru yola iletilmeye ve hayýrlý iþler yapmaya iþarettir. Ölüye dua etmek, onun ruhuna sevap göndermek demektir.', 'Ölü rüyasý, kiþinin geçmiþle olan baðýný ve biten dönemleri yansýtýr. Ölü görmek, bir dönemin sona erdiðini ve yeni bir baþlangýca hazýrlandýðýnýzý gösterebilir. Ölüyle konuþmak, içsel bir diyalog ve kendinle yüzleþmeyi temsil eder.', '[\"ölü\",\"geçmiþ\",\"dua\",\"mesaj\",\"dönüþ\"]', 1, 1, 2890, 234, 'Rüyada Ölü Görmek - Ruya Tabiri', 'Rüyada ölü görmek, geçmiþle baðlantýyý, biten bir dönemi veya manevi mesajlarý temsil eder. Ölen bir yakýnýnýzý görmek, onun için dua etmeniz gerektiðine iþaret...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('7c98f585-e8bb-463b-adec-6f60354863d3', 'Rüyada Beyaz Renk Görmek', 'ruyada-beyaz-renk-gormek', 'Rüyada beyaz renk görmek, saflýðý, temizliði ve manevi aydýnlýðý temsil eder. Beyaz elbise giymek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Beyaz çiçek görmek, saflýðý ve masumiyeti temsil eder. Beyaz ev görmek, huzurlu bir yuva anlamýna gelir.', '004d0e31-8525-46d3-80ff-e0052360bff9', 'Ýslam tabirlerinde beyaz, hayýr ve bereket rengidir. Beyaz görmek, manevi temizliðe ve günahlardan arýnmaya iþarettir. Beyaz elbise giymek, saliha bir kiþi olmaya delalettir. Beyaz, ayný zamanda hac ve umre ile de yorumlanýr.', 'Beyaz rüyasý, kiþinin iç dünyasýndaki saflýðý ve temizliði yansýtýr. Beyaz görmek, zihinsel berraklýðý ve yeni bir baþlangýç yapmaya hazýr olmayý gösterir. Beyaz, ayný zamanda barýþ ve huzur arayýþýný temsil eder.', '[\"beyaz\",\"saflýk\",\"temizlik\",\"aydýnlýk\",\"huzur\"]', 0, 1, 870, 68, 'Rüyada Beyaz Renk Görmek - Ruya Tabiri', 'Rüyada beyaz renk görmek, saflýðý, temizliði ve manevi aydýnlýðý temsil eder. Beyaz elbise giymek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Beyaz çi...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('8e3d4366-4027-4ed4-b64c-ea93e2273e33', 'Rüyada Düþmek', 'ruyada-dusmek', 'Rüyada düþmek, kontrol kaybýný, güvensizliði veya bir duruma hazýrlýksýz olmayý temsil eder. Yüksekten düþmek, büyük beklentilerin hayal kýrýklýðýna dönüþebileceðine iþaret edebilir. Düþüp kalkmak, zorluklarýn üstesinden gelmeyi gösterir. Kuyuya düþmek, beklenmedik sorunlara delalettir.', '1ceb448d-d416-48d9-8283-872fac918f07', 'Ýslam alimlerine göre düþmek, çeþitli anlamlara gelir. Yüksekten düþmek, makam kaybýna veya hataya iþaret edebilir. Düþüp yaralanmak, bir zorlukla karþýlaþmaya delalettir. Düþüp kalkmak, tövbe etmeye ve hatadan dönmeye iþarettir.', 'Düþme rüyasý, kiþinin hayattaki güvensizliklerini ve korkularýný yansýtýr. Düþmek, kontrolü kaybetme korkusunu temsil eder. Yüksekten düþmek, kiþinin beklentilerinin yüksek olduðunu ve hayal kýrýklýðý yaþama riskini gösterir.', '[\"düþmek\",\"kontrol\",\"güvensizlik\",\"korku\",\"zorluk\"]', 0, 1, 1230, 89, 'Rüyada Düþmek - Ruya Tabiri', 'Rüyada düþmek, kontrol kaybýný, güvensizliði veya bir duruma hazýrlýksýz olmayý temsil eder. Yüksekten düþmek, büyük beklentilerin hayal kýrýklýðýna dönüþebilec...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('9120dfcd-625a-495b-ad3a-67c4b0c8c5b8', 'Rüyada Kar Görmek', 'ruyada-kar-gormek', 'Rüyada kar görmek, saflýðý, temizliði ve yeni baþlangýçlarý temsil eder. Beyaz kar görmek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Kar topu oynamak, neþeli haberler ve güzel geliþmeler anlamýna gelir. Kar fýrtýnasý, geçici zorluklarý temsil edebilir.', NULL, 'Ýslam tabirlerinde kar, rahmet ve bereket anlamýna gelir. Kar görmek, günahlardan arýnmaya ve manevi temizliðe iþarettir. Kar yaðýþý, sýkýntýlarýn sona ermesine ve ferahlýða kavuþmaya delalettir.', 'Kar rüyasý, kiþinin iç dünyasýndaki saflýðý ve temizliði yansýtýr. Kar görmek, yeni bir baþlangýç yapmaya hazýr olduðunuzu gösterir. Beyaz kar, zihinsel berraklýðý ve netliði temsil eder.', '[\"kar\",\"saflýk\",\"temizlik\",\"yeni baþlangýç\",\"rahmet\"]', 0, 1, 765, 58, 'Rüyada Kar Görmek - Ruya Tabiri', 'Rüyada kar görmek, saflýðý, temizliði ve yeni baþlangýçlarý temsil eder. Beyaz kar görmek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Kar topu oynamak...', '2026-02-16 10:14:37', '2026-02-16 10:26:36'),
('96cb78b0-ba59-4aeb-8615-eef4af2a93e8', 'Rüyada Yýlan Görmek', 'ruyada-yilan-gormek', 'Rüyada yýlan görmek, genellikle düþmanlýk, tehlike veya gizli tehditleri temsil eder. Yýlanýn ýsýrdýðýný görmek, bir düþmandan zarar görmeye iþaret eder. Yýlaný öldürmek, düþmanlarý yenmek anlamýna gelir. Bazý durumlarda yýlan, þifa ve dönüþümü de simgeleyebilir.', '49767b7a-7c91-49b5-9ddc-ea5c3b111a89', 'Ýslam alimlerine göre yýlan, düþmaný temsil eder. Yýlan görmek, gizli bir düþmanýn varlýðýna iþarettir. Yýlanýn evde olmasý, aile içi sorunlara delalettir. Yýlaný öldürmek, düþmaný alt etmeye ve tehlikeden kurtulmaya iþaret eder.', 'Yýlan rüyasý, kiþinin bilinçaltýndaki korkularýný ve endiþelerini yansýtýr. Yýlan, dönüþüm ve yenilenmeyi de temsil edebilir. Yýlanla yüzleþmek, kiþinin korkularýyla baþa çýkmasý gerektiðini gösterir.', '[\"yýlan\",\"düþman\",\"tehlike\",\"dönüþüm\",\"korku\"]', 1, 1, 2340, 189, 'Rüyada Yýlan Görmek - Ruya Tabiri', 'Rüyada yýlan görmek, genellikle düþmanlýk, tehlike veya gizli tehditleri temsil eder. Yýlanýn ýsýrdýðýný görmek, bir düþmandan zarar görmeye iþaret eder. Yýlaný...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('96e2ddb4-cdea-4c3e-862e-2cd66baec947', 'Rüyada Sayý Görmek', 'ruyada-sayi-gormek', 'Rüyada sayý görmek, düzeni, hesabý ve belirli anlamlarý temsil eder. Her sayýnýn kendine özgü anlamý vardýr. Sayý saymak, planlý ve programlý olmaya iþaret eder. Sayý yazmak, önemli bir konuyu hesaplamayý gösterir.', 'e3ec6792-5515-4538-82c3-652820edaf9a', 'Ýslam tabirlerinde sayýlar önemli anlamlar taþýr. Bir (1) rakamý Allah\'ýn birliðini temsil eder. Üç (3) rakamý, tamamlanmýþ bir iþi gösterir. Yedi (7) rakamý, kainatýn düzenini ve bereketi temsil eder. Kýrk (40) rakamý, olgunlaþma ve tamamlanmaya iþarettir.', 'Sayý rüyasý, kiþinin düzen ve kontrol arayýþýný yansýtýr. Sayý görmek, kiþinin hayatýndaki belirli dönemleri veya önemli tarihleri temsil edebilir. Sayýlarla uðraþmak, zihinsel aktiviteyi ve problem çözme yeteneðini gösterir.', '[\"sayý\",\"düzen\",\"hesap\",\"anlam\",\"sembol\"]', 0, 1, 780, 54, 'Rüyada Sayý Görmek - Ruya Tabiri', 'Rüyada sayý görmek, düzeni, hesabý ve belirli anlamlarý temsil eder. Her sayýnýn kendine özgü anlamý vardýr. Sayý saymak, planlý ve programlý olmaya iþaret eder...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('9e95fade-20f6-4f66-b75e-6ce1b7b09182', 'Rüyada Yaðmur Görmek', 'ruyada-yagmur-gormek', 'Rüyada yaðmur görmek, bereket, rahmet ve temizliðin sembolüdür. Hafif yaðmur görmek, hayýr ve bereket anlamýna gelir. Þiddetli yaðmur, zorluklarýn ardýndan ferahlýða kavuþacaðýnýza iþaret edebilir. Yaðmurda ýslanmak, günahlardan arýnmaya ve manevi temizliðe delalettir.', NULL, 'Ýslam alimlerine göre yaðmur, Allah\'ýn rahmetini ve bereketini temsil eder. Yaðmur görmek, dualarýn kabulüne ve sýkýntýlarýn sona ermesine iþarettir. Kuraklýk sonrasý yaðmur, darlýktan sonra bolluða kavuþmak demektir.', 'Yaðmur rüyasý, kiþinin duygusal arýnma ihtiyacýný yansýtýr. Yaðmur görmek, duygusal bir serbest býrakma ve rahatlama dönemine girildiðini gösterir. Yaðmurun þiddeti, duygusal yoðunluðu temsil eder.', '[\"yaðmur\",\"bereket\",\"rahmet\",\"temizlik\",\"arýnma\"]', 0, 1, 890, 72, 'Rüyada Yaðmur Görmek - Ruya Tabiri', 'Rüyada yaðmur görmek, bereket, rahmet ve temizliðin sembolüdür. Hafif yaðmur görmek, hayýr ve bereket anlamýna gelir. Þiddetli yaðmur, zorluklarýn ardýndan fera...', '2026-02-16 10:14:37', '2026-02-16 10:26:36'),
('a5b439ba-c7b3-41b0-aaa3-5f6b1616161a', 'Rüyada Balýk Görmek', 'ruyada-balik-gormek', 'Rüyada balýk görmek, bolluk, bereket ve rýzkýn sembolüdür. Canlý balýk görmek, hayýr ve bereket anlamýna gelir. Balýk tutmak, rýzkýn artacaðýna ve güzel haberler alýnacaðýna iþaret eder. Ölü balýk görmek, bazý tabirlere göre olumsuzluklarý temsil edebilir.', 'daecc1ff-dcea-46e7-ae72-155e3c44d2c8', 'Ýslam tabirlerinde balýk görmek çok hayýrlýdýr. Balýk, rýzkýn ve nimetin sembolüdür. Balýk tutmak, helal kazanca ve hayýrlý rýzka iþarettir. Büyük balýk görmek, büyük nimetlere kavuþmak demektir. Hz. Yunus kýssasý nedeniyle balýk ayný zamanda tövbe ve baðýþlanmayý da temsil eder.', 'Balýk rüyasý, kiþinin duygusal derinliklerini ve bilinçaltýný temsil eder. Balýk tutmak, kiþinin hedeflerine ulaþacaðýný gösterir. Suda yüzen balýklar görmek, iç huzurun ve duygusal dengenin habercisidir.', '[\"balýk\",\"bolluk\",\"bereket\",\"rýzýk\",\"nimet\"]', 1, 1, 2100, 167, 'Rüyada Balýk Görmek - Ruya Tabiri', 'Rüyada balýk görmek, bolluk, bereket ve rýzkýn sembolüdür. Canlý balýk görmek, hayýr ve bereket anlamýna gelir. Balýk tutmak, rýzkýn artacaðýna ve güzel haberle...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('ac85e27a-e01f-46cc-b599-f6321dec71d5', 'Rüyada Ateþ Görmek', 'ruyada-ates-gormek', 'Rüyada ateþ görmek, tutkuyu, enerjiyi ve dönüþümü temsil eder. Kontrollü ateþ görmek, enerjiyi doðru yönlendirmeye ve baþarýya iþaret eder. Yangýn görmek, tehlikeli durumlarý veya büyük deðiþimleri temsil edebilir. Ateþle ýsýnmak, koruma ve güvenlik anlamýna gelir.', '712c188b-24a8-4d67-b9db-a61780d5a50b', 'Ýslam alimlerine göre ateþ, çeþitli anlamlara gelir. Ateþ görmek bazen fitneyi, bazen de ýþýðý ve aydýnlýðý temsil eder. Ateþle ýsýnmak, hayýr ve bereket anlamýna gelir. Yangýndan kaçmak, tehlikelerden korunmaya iþarettir.', 'Ateþ rüyasý, kiþinin içsel enerjisini ve tutkularýný yansýtýr. Kontrollü ateþ, enerjinin doðru yönlendirildiðini gösterir. Yangýn, kontrolsüz duygularý veya hayatýndaki kaosu temsil edebilir.', '[\"ateþ\",\"tutku\",\"enerji\",\"dönüþüm\",\"deðiþim\"]', 0, 1, 1100, 87, 'Rüyada Ateþ Görmek - Ruya Tabiri', 'Rüyada ateþ görmek, tutkuyu, enerjiyi ve dönüþümü temsil eder. Kontrollü ateþ görmek, enerjiyi doðru yönlendirmeye ve baþarýya iþaret eder. Yangýn görmek, tehli...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('c9bd7641-5054-4414-8955-1c84b33d5be1', 'Rüyada Kartal Görmek', 'ruyada-kartal-gormek', 'Rüyada kartal görmek, güç, otorite ve yüksek hedeflerin sembolüdür. Kartalýn uçtuðunu görmek, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. Kartalýn avladýðýný görmek, maddi kazanç ve zafer anlamýna gelir.', 'b2704e46-3a19-4067-94a9-a4dd88c1f8a9', 'Ýslam tabirlerinde kartal, güçlü ve etkili bir yöneticiyi temsil eder. Kartal görmek, düþmanlara karþý üstün gelmeye ve zorluklarý aþmaya iþarettir. Kartalýn pençesinde bir þey taþmasý, devlet nimetine kavuþmak demektir.', 'Kartal rüyasý, kiþinin güç arayýþýný ve liderlik özelliklerini yansýtýr. Yüksekten bakan bir kartal, kiþinin hayattan beklentilerinin yüksek olduðunu gösterir. Özgüven artýþý ve kararýlýk dönemine girildiðinin habercisidir.', '[\"kartal\",\"güç\",\"liderlik\",\"baþarý\",\"zafer\"]', 1, 1, 980, 67, 'Rüyada Kartal Görmek - Ruya Tabiri', 'Rüyada kartal görmek, güç, otorite ve yüksek hedeflerin sembolüdür. Kartalýn uçtuðunu görmek, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. K...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('cfe5fc5a-8cbb-4816-bd7d-dede9ba93595', 'Rüyada Ekmek Görmek', 'ruyada-ekmek-gormek', 'Rüyada ekmek görmek, rýzký, bereketi ve hayatýn temel ihtiyaçlarýný temsil eder. Taze ekmek görmek, bolluk ve bereket anlamýna gelir. Ekmek yemek, helal rýzka ve hayýrlý nimetlere iþaret eder. Ekmek bölmek, cömertlik ve paylaþmayý gösterir.', '68e9038f-6e8e-4bed-8922-830b8879409f', 'Ýslam alimlerine göre ekmek, rýzkýn ve nimetin en belirgin sembolüdür. Beyaz ekmek görmek, helal rýzka ve berekete iþarettir. Ekmek yemek, hayatýn kolaylaþacaðýna ve rýzkýn artacaðýna delalettir. Ekmek vermek, sadaka ve hayýr yapmaya iþarettir.', 'Ekmek rüyasý, kiþinin temel ihtiyaçlarýný ve güvenlik duygusunu yansýtýr. Ekmek görmek, kiþinin hayatýnda bolluk ve bereket arayýþýný gösterir. Ekmek paylaþmak, kiþinin cömertlik ve yardýmseverlik özelliklerini temsil eder.', '[\"ekmek\",\"rýzýk\",\"bereket\",\"nimet\",\"bolluk\"]', 1, 1, 1560, 128, 'Rüyada Ekmek Görmek - Ruya Tabiri', 'Rüyada ekmek görmek, rýzký, bereketi ve hayatýn temel ihtiyaçlarýný temsil eder. Taze ekmek görmek, bolluk ve bereket anlamýna gelir. Ekmek yemek, helal rýzka v...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('d3861a78-1112-4380-8af7-f1bad95e6e2d', 'Rüyada Elma Görmek', 'ruyada-elma-gormek', 'Rüyada elma görmek, güzelliði, bilgeliði ve bereketi temsil eder. Kýrmýzý elma görmek, sevgi ve tutkuya iþaret eder. Yeþil elma, umut ve yeni baþlangýçlarý temsil eder. Elma yemek, hayýrlý rýzka ve güzel haberlere delalettir.', '68e9038f-6e8e-4bed-8922-830b8879409f', 'Ýslam tabirlerinde elma, hayýr ve bereket anlamýna gelir. Elma görmek, hayýrlý rýzka ve güzel nimetlere iþarettir. Elma vermek, sevgi ve dostluðu temsil eder. Elma aðacý görmek, bolluk ve bereketli bir ömre delalettir.', 'Elma rüyasý, kiþinin arzularýný ve hedeflerini yansýtýr. Elma görmek, kiþinin hayatýnda güzel geliþmelerin olacaðýný gösterir. Elma yemek, kiþinin emeklerinin karþýlýðýný alacaðýný temsil eder.', '[\"elma\",\"güzellik\",\"bilgelik\",\"bereket\",\"sevgi\"]', 0, 1, 890, 67, 'Rüyada Elma Görmek - Ruya Tabiri', 'Rüyada elma görmek, güzelliði, bilgeliði ve bereketi temsil eder. Kýrmýzý elma görmek, sevgi ve tutkuya iþaret eder. Yeþil elma, umut ve yeni baþlangýçlarý tems...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('d5cff531-d45b-4e4f-a472-cfce8dd6d148', 'Rüyada Aslan Görmek', 'ruyada-aslan-gormek', 'Rüyada aslan görmek, güç, cesaret ve liderliðin sembolüdür. Aslanýn sakin olduðunu görmek, otorite ve saygýnlýk anlamýna gelir. Aslanla karþýlaþmak, büyük bir sýnavla karþýlaþacaðýnýza iþaret eder. Aslaný yenmek, düþmanlarý alt etmeye ve zorluklarý aþmaya delalettir.', '49767b7a-7c91-49b5-9ddc-ea5c3b111a89', 'Ýslam tabirlerinde aslan, güçlü bir hükümdarý veya zorlu bir düþmaný temsil eder. Aslan görmek, cesaret ve kuvvete iþarettir. Aslanla dost olmak, güçlü kiþilerden yardým almak demektir. Aslanýn saldýrmasý, büyük bir tehlikeye iþaret eder.', 'Aslan rüyasý, kiþinin iç gücünü ve liderlik potansiyelini yansýtýr. Aslan görmek, kiþinin hayatýnda daha cesur ve kararý olmasý gerektiðini gösterir. Aslanla mücadele etmek, içsel çatýþmalarýn üstesinden gelmeye iþarettir.', '[\"aslan\",\"güç\",\"cesaret\",\"liderlik\",\"otorite\"]', 1, 1, 1890, 156, 'Rüyada Aslan Görmek - Ruya Tabiri', 'Rüyada aslan görmek, güç, cesaret ve liderliðin sembolüdür. Aslanýn sakin olduðunu görmek, otorite ve saygýnlýk anlamýna gelir. Aslanla karþýlaþmak, büyük bir s...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('d9382de1-dc8f-467d-a3b3-0f1b4105bf52', 'Rüyada Baykuþ Görmek', 'ruyada-baykus-gormek', 'Rüyada baykuþ görmek genellikle gizemli haberlerin iþaretçisidir. Bazý kültürlerde uðursuz sayýlsa da, rüya tabirlerinde bilgelik ve içgörü anlamýna gelir. Baykuþun sesini duymak, önemli bir haber alýnacaðýna iþaret eder.', 'b2704e46-3a19-4067-94a9-a4dd88c1f8a9', 'Ýslam alimleri, baykuþ görmeyi farklý þekillerde yorumlamýþtýr. Bazýlarýna göre baykuþ, yaþlý ve bilgili bir kiþiyi temsil eder. Baykuþ sesi duymak, gizli sýrlarýn ortaya çýkmasýna veya önemli bir habere iþaret edebilir.', 'Baykuþ, bilinçaltýnýn derinliklerini ve gizli bilgileri temsil eder. Rüyada baykuþ görmek, kiþinin sezgilerinin güçlendiðini ve içgörü kazanacaðýný gösterir. Gece baykuþu görmek, bilinmeyen korkularla yüzleþmeye iþarettir.', '[\"baykuþ\",\"bilgelik\",\"gizem\",\"haber\",\"sezi\"]', 0, 1, 756, 45, 'Rüyada Baykuþ Görmek - Ruya Tabiri', 'Rüyada baykuþ görmek genellikle gizemli haberlerin iþaretçisidir. Bazý kültürlerde uðursuz sayýlsa da, rüya tabirlerinde bilgelik ve içgörü anlamýna gelir. Bayk...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('d9428ab3-ff59-4ede-b51f-27f5e946e0cb', 'Rüyada Siyah Renk Görmek', 'ruyada-siyah-renk-gormek', 'Rüyada siyah renk görmek, gizemi, bilinmeyeni veya üzüntüyü temsil edebilir. Siyah elbise giymek, bir yas veya üzüntü dönemine iþaret edebilir. Siyah taþ görmek, dayanýklýlýðý ve güçlü olmayý temsil eder. Siyah kuþ görmek, gizemli haberlere delalettir.', '004d0e31-8525-46d3-80ff-e0052360bff9', 'Ýslam alimlerine göre siyah, çeþitli anlamlara gelir. Siyah bazen güç ve kuvveti, bazen de üzüntüyü temsil eder. Siyah elbise giymek, bir üzüntü veya yasa iþaret edebilir. Ancak siyahýn anlamý, rüyanýn diðer unsurlarýna göre deðiþir.', 'Siyah rüyasý, kiþinin bilinçaltýndaki korkularýný veya bastýrýlmýþ duygularýný yansýtýr. Siyah görmek, kiþinin bilinmeyenle yüzleþmesi gerektiðini gösterebilir. Siyah ayný zamanda güç ve otoriteyi de temsil edebilir.', '[\"siyah\",\"gizem\",\"bilinmeyen\",\"güç\",\"üzüntü\"]', 0, 1, 920, 71, 'Rüyada Siyah Renk Görmek - Ruya Tabiri', 'Rüyada siyah renk görmek, gizemi, bilinmeyeni veya üzüntüyü temsil edebilir. Siyah elbise giymek, bir yas veya üzüntü dönemine iþaret edebilir. Siyah taþ görmek...', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('e43fb34d-155e-40bc-acda-b33e5405b030', 'Rüyada Deniz Görmek', 'ruyada-deniz-gormek', 'Rüyada deniz görmek, geniþ ufuklarý, özgürlüðü ve bilinmeyeni temsil eder. Sakin bir deniz görmek, huzur ve istikrar anlamýna gelir. Dalgalý deniz, heyecanlý geliþmelere ve deðiþimlere iþaret eder. Denizde yüzmek, özgürlük ve macera arayýþýný gösterir.', '76322546-f026-44d8-bf54-51f7184bf70b', 'Ýslam alimlerine göre deniz, dünya ve içindekileri temsil eder. Sakin deniz, rahatlýk ve geniþlik anlamýna gelir. Denizden su içmek, rýzkýn artmasýna ve hayýrlý nimetlere iþarettir. Denizde boðulmak, dünya iþlerine dalmaya delalettir.', 'Deniz rüyasý, kiþinin duygusal derinliðini ve bilinçaltýný yansýtýr. Sakin deniz, duygusal dengeyi; dalgalý deniz ise duygusal çalkantýlarý temsil eder. Deniz kýyýsýnda olmak, bilinç ve bilinçaltý arasýndaki sýnýrý gösterir.', '[\"deniz\",\"özgürlük\",\"ufuk\",\"duygusal\",\"derinlik\"]', 1, 1, 1670, 134, 'Rüyada Deniz Görmek - Ruya Tabiri', 'Rüyada deniz görmek, geniþ ufuklarý, özgürlüðü ve bilinmeyeni temsil eder. Sakin bir deniz görmek, huzur ve istikrar anlamýna gelir. Dalgalý deniz, heyecanlý ge...', '2026-02-16 10:14:37', '2026-02-16 10:14:37');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `dream_journal`
--

CREATE TABLE `dream_journal` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `dream_date` date DEFAULT NULL,
  `mood` enum('happy','sad','scared','confused','peaceful','anxious','excited','neutral') DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `is_private` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `dream_likes`
--

CREATE TABLE `dream_likes` (
  `id` varchar(36) NOT NULL,
  `dream_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `favorites`
--

CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `dream_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `profiles`
--

CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `email`, `full_name`, `username`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES
('0d066fdf-bc7c-4c62-a33f-362bb79656a9', 'f3b68c1d-622d-4a32-8a1f-48d477220974', 'admin-test-1771254120095@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('0ede336a-6419-4fb4-84cf-e22360fd1af0', '6b3f67af-d4fa-4eed-8d4d-5b559ac072a8', 'admin-test-1771229083388@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('1a86b685-7d0e-4048-bdc5-e5b5d379aeb8', 'a4b5a05a-d55d-4d4c-88a7-e154fdf0cbc1', 'regular-user-1771254120560@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('1b65ec50-2a9d-455f-86fc-db0cdd479625', '08f73836-c707-4aca-831d-efafe3ed1e78', 'regular-user-1771254120559@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('2eb51565-f1b0-4f64-b016-913703d13019', '91bd43b2-1307-4a2c-a066-be1069e1d022', 'regular-user-1772027552797@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-25 16:52:33', '2026-02-25 16:52:33'),
('30e3b83e-f454-4e9b-a57f-f37b6f85c7e1', 'eea34897-ca55-4cd4-a8ce-cdf152d91232', 'test-1771254120031@example.com', 'Test User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('3861400b-1a3f-4430-adde-3342be84c03e', '5c6cef6a-ba79-4efd-b033-3d2438e7cd34', 'regular-user-1771229083870@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 11:04:44', '2026-02-16 11:04:44'),
('3cd8a319-b70d-422f-9122-c4eaf66d4344', '88fd10e5-2737-45af-ae0f-8d4992f872b2', 'admin-test-1772027552258@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('3e15a783-1718-47f6-ac35-ff12d5360db2', 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin@mysticlogbook.com', 'Admin User', 'admin', NULL, NULL, '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('4f8d7b79-a3d0-4df8-85f2-1aea0ded28a3', '4811b2a5-5753-431c-aef1-67e266e5a7af', 'admin-test-1772027552184@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('52dd33be-b39e-49ec-be5a-89b6e2a26789', '14a716af-eff9-4edb-948f-4a2a015b9d6b', 'admin-test-1771254120092@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('57e80888-aa80-4023-a03a-a03072f1f033', 'c8608f16-b256-45fe-8aa1-372551422e08', 'admin-test-1771254120146@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('831dbab0-eaa0-4715-bbf8-b0ce8d31a62f', 'c34c013f-d286-4b40-a4aa-aac00fef55f9', 'regular-user-1771229083873@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 11:04:44', '2026-02-16 11:04:44'),
('86aba09d-efff-4a66-8a28-61efa0c522f5', '958146e8-a252-4fbb-bea3-cfe9071f7e14', 'regular-user-1772027552800@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-25 16:52:33', '2026-02-25 16:52:33'),
('88b2b037-0052-4a7c-af94-c9f50fd6282f', '51acf355-7d17-4b76-ab17-042d70e90e5a', 'test-1772027552274@example.com', 'Test User', NULL, NULL, NULL, '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('a1c903d0-ace9-4f90-9e9e-e65187c99ff8', 'bc698ff4-46dc-457d-b376-34081fce7a79', 'regular-user-1771254120561@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('a356b892-b286-4685-8431-630d63b08349', 'bf0eadb3-d90b-4ead-9222-4fe7fbe7026b', 'admin-test-1771254120094@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('af843bd2-13fb-4a5a-b912-3f7614a66ca9', '0cb75c09-fa4e-48ca-8c1c-1b2581f70ffa', 'admin-test-1771229083397@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('b1875fde-b69a-4f4f-a18a-8434190d245c', '34283602-0f68-4bf0-81a7-75171f80dea5', 'admin-test-1771229083411@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('bb27733d-3fd1-483a-b068-d02d737138d1', '09044102-d721-4b76-8d2b-a77cfda4071a', 'admin-test-1771254120091@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('c3458a51-875b-457b-8be5-c7c1880c65b8', '7d1c9664-4a24-45e4-97c8-b851cb3d8c9f', 'regular-user-1771229083875@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-16 11:04:44', '2026-02-16 11:04:44'),
('c477341b-9fe5-4caa-8c5f-21e517a9f777', 'f002df8c-345b-40c5-9241-5e5a3ad53d52', 'admin-test-1772027552224@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('c739fcce-7ba1-4510-8fa3-870cf919a8d3', '87d28c3f-9dd9-4d3b-bc9b-36aa56eafd90', 'admin-test-1771229083399@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('cb9daf4e-89ad-4726-908e-b0d1b7845bd7', 'cf291931-9e73-441a-b0ff-127c78a5c164', 'admin-test-1771229083406@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('d27b67dd-7d18-4eb8-aca3-bea0498f7268', '9aec2cd9-0f51-4d99-8d4b-249ed19e70c6', 'regular-user-1772027552799@example.com', 'Regular User', NULL, NULL, NULL, '2026-02-25 16:52:33', '2026-02-25 16:52:33'),
('dca06782-4765-4aa0-b9cf-8fc4f7a3a3f4', 'f1855aaf-e686-4000-9cb6-7f4a0c98ea9c', 'test-1771229083354@example.com', 'Test User', NULL, NULL, NULL, '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('f38ae4f3-60e2-4a59-8819-4c982fee60f9', '61c91443-a805-4fe6-afad-2ce898f4cb1a', 'admin-test-1772027552292@example.com', 'Admin User', NULL, NULL, NULL, '2026-02-25 16:52:32', '2026-02-25 16:52:32');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `search_logs`
--

CREATE TABLE `search_logs` (
  `id` varchar(36) NOT NULL,
  `query` varchar(500) NOT NULL,
  `results_count` int(11) DEFAULT 0,
  `user_id` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `search_logs`
--

INSERT INTO `search_logs` (`id`, `query`, `results_count`, `user_id`, `created_at`) VALUES
('0090ec0a-04e2-4b4c-a742-e2d1c4eef98d', 'rüya', 21, NULL, '2026-02-16 11:04:59'),
('0b530b11-44bb-417b-8816-919f4e2a7e5b', 'zzzzznonmatchingquery12345', 0, NULL, '2026-02-25 16:54:05'),
('0f09a015-2030-480f-bb8e-5e1928419db9', 'test', 0, NULL, '2026-02-25 16:53:04'),
('0f4e2a45-c26a-4530-bf8c-d2dcbafbfa74', 'test', 0, NULL, '2026-02-16 18:02:16'),
('147b3825-2d3e-4bb5-aa87-b634e9ce76c1', 'test', 0, NULL, '2026-02-25 16:53:59'),
('258f9276-5047-4911-adee-aef81f324061', 'test', 0, NULL, '2026-02-25 16:53:02'),
('45600aef-a505-496c-92bc-79943ef6c2dc', 'test', 0, NULL, '2026-02-25 16:52:50'),
('47c502e5-a698-4061-bd0d-f2e04c8b8fb6', '<script>alert(\"xss\")</script>', 0, NULL, '2026-02-25 16:56:46'),
('481e48fa-22d8-4ae6-b7e9-d78071c02570', 'zzzzznonmatchingquery12345', 0, NULL, '2026-02-25 16:53:04'),
('4edce367-8465-41ca-8ea9-f7366ca33ba4', 'test', 0, NULL, '2026-02-25 16:53:59'),
('58e76abb-707d-4969-9c9c-c41c23f477a5', 'rüya', 21, NULL, '2026-02-25 16:58:11'),
('592cb254-af75-4b38-bba1-3a6331fd0614', '<script>alert(\"xss\")</script>', 0, NULL, '2026-02-25 16:56:23'),
('5b409c9b-2fbf-412d-98d5-274facf40882', 'test', 0, NULL, '2026-02-25 16:55:57'),
('5e9e8a74-dd2b-4d67-801d-081652e177fd', '<script>alert(\"xss\")</script>', 0, NULL, '2026-02-25 16:57:14'),
('647a2871-908b-4695-8a19-ce4ec26a2da3', 'test', 0, NULL, '2026-02-25 16:53:02'),
('66adc76e-09ca-496f-a1ed-b064c4d515c2', 'test', 0, NULL, '2026-02-16 18:02:16'),
('6949b61d-cc3c-4b14-85f5-2f97829710a9', 'zzzzznonmatchingquery12345', 0, NULL, '2026-02-16 11:05:01'),
('720170d7-8eba-473a-a8c8-fec0dbcd81dd', 'test', 0, NULL, '2026-02-16 18:02:16'),
('7649717c-30a3-44b4-b52e-40b6cc957dfe', 'test', 0, NULL, '2026-02-16 11:04:59'),
('7cc9608c-0a54-4192-b5cb-2b3ba168c7f7', 'test', 0, NULL, '2026-02-25 16:52:50'),
('869192cf-7370-4fa1-8733-7eaacdea2632', 'test', 0, NULL, '2026-02-16 18:02:16'),
('8b10121b-1d02-4104-bbd8-ad2369c98469', 'rüya', 21, NULL, '2026-02-16 18:02:16'),
('8c77667f-496b-4928-89b7-b8e9d0a09e22', 'rüya', 21, NULL, '2026-02-25 16:58:42'),
('91a34c12-5e89-44cf-bdbf-fcc8af96b620', 'test', 0, NULL, '2026-02-25 16:57:47'),
('a10bd1ef-9122-4e7e-9759-ee86322a6f8d', 'rüya', 21, NULL, '2026-02-25 16:56:45'),
('a1efd09c-e255-4aa1-9a38-6af7c88a62ea', 'test', 0, NULL, '2026-02-16 11:04:58'),
('a9b10737-39af-45d1-a940-0df2aa651c93', 'zzzzznonmatchingquery12345', 0, NULL, '2026-02-16 18:02:18'),
('bcf22af4-a8ed-407a-8d69-6567158f228a', 'test', 0, NULL, '2026-02-16 11:04:59'),
('bf91465f-3165-430e-995e-c1dd248cf6be', 'rüya', 21, NULL, '2026-02-25 16:58:32'),
('c86275ab-1cd4-4189-a214-bedc5fae2607', 'test', 0, NULL, '2026-02-25 16:56:45'),
('d38332e0-1010-486f-8543-6cc611b3fb39', 'test', 0, NULL, '2026-02-25 16:52:50'),
('d50c6d6c-8ae7-4e65-9a8e-44cf31ecbb85', 'rüya', 21, NULL, '2026-02-25 16:57:25'),
('e22a4d02-310f-4026-b7ad-7c8d5f6b3a6a', 'zzzzznonmatchingquery12345', 0, NULL, '2026-02-25 16:52:52'),
('e4bf55fc-3329-4236-878c-ee2ec15374ac', 'test', 0, NULL, '2026-02-25 16:53:02'),
('e7bcd882-5f04-44df-968b-8ad991bffdb0', 'rüya', 21, NULL, '2026-02-25 16:57:46'),
('eda27aae-35de-45c0-bd6e-c47a89ec2c8f', 'test', 0, NULL, '2026-02-25 16:53:59'),
('f1129bcd-a1d6-47b7-b5a0-291a51422dbb', 'test', 0, NULL, '2026-02-16 11:04:58'),
('f4c82d75-d169-4a40-bc0d-2fa322adb31e', 'test', 0, NULL, '2026-02-25 16:55:39'),
('f71e8265-d05e-4104-9e75-907072364d17', 'test', 0, NULL, '2026-02-25 16:54:02'),
('f725c349-5ca3-4ad2-bd5c-52325d7c064d', 'test', 0, NULL, '2026-02-25 16:52:50'),
('f72f881e-2261-4ec0-a08a-ccbb04cfa3b8', 'test', 0, NULL, '2026-02-25 16:58:02'),
('fa3dc2da-38ca-463f-9633-bb16adde47be', 'test', 0, NULL, '2026-02-16 18:02:16'),
('fea686ee-4cec-4fe8-9123-7da6fdaee463', 'test', 0, NULL, '2026-02-16 11:04:59'),
('ffb21c11-6070-4642-b90f-6fa926d7a24b', 'test', 0, NULL, '2026-02-25 16:56:04');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `site_settings`
--

CREATE TABLE `site_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `site_settings`
--

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
('80f50dcd-0a4b-11f1-8177-b025aa3820ab', 'site_name', '\"Mystic Logbook\"', '2026-02-15 11:51:22', '2026-02-15 11:51:22'),
('80f51f0f-0a4b-11f1-8177-b025aa3820ab', 'site_description', '\"Rüya Tabirleri ve Yorumlar\"', '2026-02-15 11:51:22', '2026-02-15 11:51:22'),
('80f52051-0a4b-11f1-8177-b025aa3820ab', 'contact_email', '\"info@mysticlogbook.com\"', '2026-02-15 11:51:22', '2026-02-15 11:51:22');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`, `updated_at`) VALUES
('08f73836-c707-4aca-831d-efafe3ed1e78', 'regular-user-1771254120559@example.com', '$2a$10$q9/zNAeIjhRcVLwHWMo/S.iALKrLbLEmJYMFRm/Ko225UpZ/mDyBS', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('09044102-d721-4b76-8d2b-a77cfda4071a', 'admin-test-1771254120091@example.com', '$2a$10$L7OwCg5mTfT7.dPonAJLGuTVfInrtC1x0TBIpVsGiwNZ1RxhugjS2', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('0cb75c09-fa4e-48ca-8c1c-1b2581f70ffa', 'admin-test-1771229083397@example.com', '$2a$10$mK9meLowx46HE2Sq9jQSMO99kNtG7UY5SpFki2yw2juH.Fv/nsSXy', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('14a716af-eff9-4edb-948f-4a2a015b9d6b', 'admin-test-1771254120092@example.com', '$2a$10$gqZZ/cX2nDOh.OGWsIgd3e3B6/.uvZLo75HallNOrSgvCSEOhJoZe', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('34283602-0f68-4bf0-81a7-75171f80dea5', 'admin-test-1771229083411@example.com', '$2a$10$8bmIR4Cqp7zFPadLPrzI7.9W.i9quzquUvu9toGMSkZelm2xrlSV6', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('4811b2a5-5753-431c-aef1-67e266e5a7af', 'admin-test-1772027552184@example.com', '$2a$10$Afl3VXuEI5G60AT78C7XSeY7/wFzEvlSYNcwvpQXPEj6bVAo2Dx2W', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('51acf355-7d17-4b76-ab17-042d70e90e5a', 'test-1772027552274@example.com', '$2a$10$uuLa3iT6W/yIjkYS3l361urAJC32h3Z82P5LtjWc9PFIQMPxONWFq', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('5c6cef6a-ba79-4efd-b033-3d2438e7cd34', 'regular-user-1771229083870@example.com', '$2a$10$3sgpn/4ufmuFJJ.Off4xH.Vn4u2MEQcb2ET8/0X/vaAHMepLtXd7m', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('61c91443-a805-4fe6-afad-2ce898f4cb1a', 'admin-test-1772027552292@example.com', '$2a$10$Pc3Q2mW6kImxmehtkEh2BO4oAvDHd3hbCtrmDDzxOoB1RUovZWbyS', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('6b3f67af-d4fa-4eed-8d4d-5b559ac072a8', 'admin-test-1771229083388@example.com', '$2a$10$RUwYW7qmIyYSKVTFzuw3Ge2kNyp75q6Z5d7F8Nh2fci.4mGFBAPcu', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('7d1c9664-4a24-45e4-97c8-b851cb3d8c9f', 'regular-user-1771229083875@example.com', '$2a$10$b3juEJVYavnQKdsgixW/ge6G.Yim8xrWFTM7lkzEEn1BWK6Bor3Im', '2026-02-16 11:04:44', '2026-02-16 11:04:44'),
('87d28c3f-9dd9-4d3b-bc9b-36aa56eafd90', 'admin-test-1771229083399@example.com', '$2a$10$DTvUPx.gdBSzKcNikeerZeTzw9irQC2vDce5tR/78N0meH4cy0mZC', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('88fd10e5-2737-45af-ae0f-8d4992f872b2', 'admin-test-1772027552258@example.com', '$2a$10$LrtwiIkH00aWf6HLLpWyz.M2K9myq.K/Ej9AEZGbvLS6KrdIavXTu', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('91bd43b2-1307-4a2c-a066-be1069e1d022', 'regular-user-1772027552797@example.com', '$2a$10$mzKrhzx22Qaa2tLU5PMMBOX/4Ml4Nh7Otno0kNuk9uJau8hXCrrfG', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('958146e8-a252-4fbb-bea3-cfe9071f7e14', 'regular-user-1772027552800@example.com', '$2a$10$gmYKnhMBVoszqx5St57Ezeelc7h2FTbel7JyGWo5w6WSA5phosND2', '2026-02-25 16:52:33', '2026-02-25 16:52:33'),
('9aec2cd9-0f51-4d99-8d4b-249ed19e70c6', 'regular-user-1772027552799@example.com', '$2a$10$/YyO6l5pQtPWq/0TDy4LJ.mafQey9DOQaVcyjdGlZI1N6pTFL8XNS', '2026-02-25 16:52:33', '2026-02-25 16:52:33'),
('a4b5a05a-d55d-4d4c-88a7-e154fdf0cbc1', 'regular-user-1771254120560@example.com', '$2a$10$FON.WqH3QTjqIO.tTAITE.BufMD4mFCy4nb0uaMeDtX8NGwc1jcci', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('bc698ff4-46dc-457d-b376-34081fce7a79', 'regular-user-1771254120561@example.com', '$2a$10$nLIJUsLViZ72aW5nGueYvurMP2mI7yFyYA5LtnaiH0qFvkOdylDRW', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('bf0eadb3-d90b-4ead-9222-4fe7fbe7026b', 'admin-test-1771254120094@example.com', '$2a$10$//R4RzNCR1mWqTS6exu6GO3tNuGk.zuqUwqHlb/74eyquj72SykEG', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin@mysticlogbook.com', '$2a$10$SwC6rZZlQ1VXtBKOUVNeCOa9PkK88tVdivGvOS5KpAhs.OO4DgFMa', '2026-02-16 10:14:37', '2026-02-16 10:14:37'),
('c34c013f-d286-4b40-a4aa-aac00fef55f9', 'regular-user-1771229083873@example.com', '$2a$10$OUS9KLkxuT6GKL86nx8j1eGkJoS0Q.RGDcG895eHPDo4hBOYx42rG', '2026-02-16 11:04:44', '2026-02-16 11:04:44'),
('c8608f16-b256-45fe-8aa1-372551422e08', 'admin-test-1771254120146@example.com', '$2a$10$n9guS9qY1IwZBIfJkduTb.XRVLlMedJLCkl4NeFgKtkKcrm.7ATl6', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('cf291931-9e73-441a-b0ff-127c78a5c164', 'admin-test-1771229083406@example.com', '$2a$10$tucqh8KRz37adwJEp1XxX.lNfrf7t4pPdv3f/3y.6wEaEXrVb9Mpu', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('eea34897-ca55-4cd4-a8ce-cdf152d91232', 'test-1771254120031@example.com', '$2a$10$L8B5nOUtFVzSy45tWqoDleM8kb.p40MLBhdvuak2v.gMU9J.b48X.', '2026-02-16 18:02:00', '2026-02-16 18:02:00'),
('f002df8c-345b-40c5-9241-5e5a3ad53d52', 'admin-test-1772027552224@example.com', '$2a$10$vWogM1Hx1Xunlv8CDq81q.b9WY6x79tGohfXBwiUL8RHK4FnYHbXa', '2026-02-25 16:52:32', '2026-02-25 16:52:32'),
('f1855aaf-e686-4000-9cb6-7f4a0c98ea9c', 'test-1771229083354@example.com', '$2a$10$InH2wkFviZWEQcgu.ebJ9eN.6BEnE9CFPaZ91KGYr0pjVgAmkWcdu', '2026-02-16 11:04:43', '2026-02-16 11:04:43'),
('f3b68c1d-622d-4a32-8a1f-48d477220974', 'admin-test-1771254120095@example.com', '$2a$10$Yr7.mO1ahLMJGyz74FiRY.oNnrTOy9acs.39B1u3bcm8Qx4ulxZVu', '2026-02-16 18:02:00', '2026-02-16 18:02:00');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_roles`
--

CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('admin','moderator','user') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`) VALUES
('097b88bd-2eb4-4cd7-bc48-206c65c61cda', 'a4b5a05a-d55d-4d4c-88a7-e154fdf0cbc1', 'user', '2026-02-16 18:02:00'),
('17d33573-8c47-4cf6-9673-8981e2c0df9c', '87d28c3f-9dd9-4d3b-bc9b-36aa56eafd90', 'user', '2026-02-16 11:04:43'),
('1ab2db01-8d2a-48d1-9d1d-1da353ce359b', 'c34c013f-d286-4b40-a4aa-aac00fef55f9', 'user', '2026-02-16 11:04:44'),
('24959f5f-8a18-413a-9571-2cc82ccfb518', '7d1c9664-4a24-45e4-97c8-b851cb3d8c9f', 'user', '2026-02-16 11:04:44'),
('26f9877f-faef-4722-b367-558721863126', 'f1855aaf-e686-4000-9cb6-7f4a0c98ea9c', 'user', '2026-02-16 11:04:43'),
('358c3ab9-1304-455a-a467-3152457c60ee', '88fd10e5-2737-45af-ae0f-8d4992f872b2', 'user', '2026-02-25 16:52:32'),
('35f1fb03-7959-4299-a5d1-41be635cc63f', '34283602-0f68-4bf0-81a7-75171f80dea5', 'user', '2026-02-16 11:04:43'),
('3e4767b5-813c-4ce0-8a7e-afaeb0708b56', 'cf291931-9e73-441a-b0ff-127c78a5c164', 'user', '2026-02-16 11:04:43'),
('44528ae8-74e6-46a7-a1e8-72cd21f77384', 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin', '2026-02-16 10:14:37'),
('48805a89-f0b0-443a-b7cc-42e38cd31a9c', '9aec2cd9-0f51-4d99-8d4b-249ed19e70c6', 'user', '2026-02-25 16:52:33'),
('527324e8-4851-40a1-b5f7-abd7ef11ec07', 'c8608f16-b256-45fe-8aa1-372551422e08', 'user', '2026-02-16 18:02:00'),
('556e450f-5448-4aa7-b612-1c232db89e66', 'eea34897-ca55-4cd4-a8ce-cdf152d91232', 'user', '2026-02-16 18:02:00'),
('58c2088d-9355-47be-9f86-d467d3bdea2f', '09044102-d721-4b76-8d2b-a77cfda4071a', 'user', '2026-02-16 18:02:00'),
('67147944-8503-4654-86f1-332f6a8681fc', 'f002df8c-345b-40c5-9241-5e5a3ad53d52', 'user', '2026-02-25 16:52:32'),
('6b8f8ca7-1e81-4f7a-b8ea-a72f5abcb321', '958146e8-a252-4fbb-bea3-cfe9071f7e14', 'user', '2026-02-25 16:52:33'),
('749665dc-8718-481f-a648-37000e5e4053', '61c91443-a805-4fe6-afad-2ce898f4cb1a', 'user', '2026-02-25 16:52:32'),
('7f35a7e8-457a-4afc-8e6c-1cffef9578c1', '08f73836-c707-4aca-831d-efafe3ed1e78', 'user', '2026-02-16 18:02:00'),
('84c1881c-50b9-4e02-bfbe-e1c40e854e91', '91bd43b2-1307-4a2c-a066-be1069e1d022', 'user', '2026-02-25 16:52:33'),
('9cfe4935-7e92-4090-9c87-381627b5b253', 'f3b68c1d-622d-4a32-8a1f-48d477220974', 'user', '2026-02-16 18:02:00'),
('a394f60c-b5e5-4720-a2fe-856fe2f0cb4c', '6b3f67af-d4fa-4eed-8d4d-5b559ac072a8', 'user', '2026-02-16 11:04:43'),
('b8c3efdb-c627-4d26-a1c7-4e8db94bd6d4', '5c6cef6a-ba79-4efd-b033-3d2438e7cd34', 'user', '2026-02-16 11:04:44'),
('c52a83c8-eb91-4b73-b0c5-79ae837a2179', '0cb75c09-fa4e-48ca-8c1c-1b2581f70ffa', 'user', '2026-02-16 11:04:43'),
('d3ae3b9c-5fa5-4252-915a-0c29c434bd5a', 'bc698ff4-46dc-457d-b376-34081fce7a79', 'user', '2026-02-16 18:02:00'),
('dbd30bf4-60d3-4b20-88c3-deac4838cecc', '14a716af-eff9-4edb-948f-4a2a015b9d6b', 'user', '2026-02-16 18:02:00'),
('f05cb568-8781-4ebf-bd4e-9fddae2572df', '4811b2a5-5753-431c-aef1-67e266e5a7af', 'user', '2026-02-25 16:52:32'),
('f70dddd2-2008-412a-b944-9c6b590294aa', 'bf0eadb3-d90b-4ead-9222-4fe7fbe7026b', 'user', '2026-02-16 18:02:00'),
('fcec9f9e-e1df-4464-8c2b-bea94c5190ee', '51acf355-7d17-4b76-ab17-042d70e90e5a', 'user', '2026-02-25 16:52:32');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `view_history`
--

CREATE TABLE `view_history` (
  `id` varchar(36) NOT NULL,
  `dream_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `viewed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_notifications_is_active` (`is_active`),
  ADD KEY `idx_admin_notifications_display_order` (`display_order`),
  ADD KEY `idx_admin_notifications_created_at` (`created_at`),
  ADD KEY `idx_admin_notifications_expires_at` (`expires_at`);

--
-- Tablo için indeksler `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_user_id` (`user_id`),
  ADD KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_logs_created_at` (`created_at`);

--
-- Tablo için indeksler `blog_categories`
--
ALTER TABLE `blog_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_blog_categories_slug` (`slug`);

--
-- Tablo için indeksler `blog_comments`
--
ALTER TABLE `blog_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `idx_blog_comments_post_id` (`post_id`),
  ADD KEY `idx_blog_comments_user_id` (`user_id`);

--
-- Tablo için indeksler `blog_comment_likes`
--
ALTER TABLE `blog_comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_blog_comment_likes_unique` (`comment_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `blog_likes`
--
ALTER TABLE `blog_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_blog_likes_unique` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_blog_posts_slug` (`slug`),
  ADD KEY `idx_blog_posts_author_id` (`author_id`),
  ADD KEY `idx_blog_posts_category_id` (`category_id`),
  ADD KEY `idx_blog_posts_is_published` (`is_published`);
ALTER TABLE `blog_posts` ADD FULLTEXT KEY `idx_blog_posts_search` (`title`,`content`);

--
-- Tablo için indeksler `blog_subscribers`
--
ALTER TABLE `blog_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_blog_subscribers_email` (`email`),
  ADD KEY `idx_blog_subscribers_verification_token` (`verification_token`);

--
-- Tablo için indeksler `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_categories_slug` (`slug`),
  ADD KEY `idx_categories_parent_id` (`parent_id`);

--
-- Tablo için indeksler `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_dream_id` (`dream_id`),
  ADD KEY `idx_comments_user_id` (`user_id`);

--
-- Tablo için indeksler `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_comment_likes_unique` (`comment_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_messages_is_read` (`is_read`);

--
-- Tablo için indeksler `dreams`
--
ALTER TABLE `dreams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_dreams_slug` (`slug`),
  ADD KEY `idx_dreams_category_id` (`category_id`),
  ADD KEY `idx_dreams_is_published` (`is_published`),
  ADD KEY `idx_dreams_is_featured` (`is_featured`);
ALTER TABLE `dreams` ADD FULLTEXT KEY `idx_dreams_search` (`title`,`content`);

--
-- Tablo için indeksler `dream_journal`
--
ALTER TABLE `dream_journal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dream_journal_user_id` (`user_id`),
  ADD KEY `idx_dream_journal_dream_date` (`dream_date`);

--
-- Tablo için indeksler `dream_likes`
--
ALTER TABLE `dream_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_dream_likes_unique` (`dream_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_favorites_unique` (`dream_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_profiles_email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_profiles_username` (`username`);

--
-- Tablo için indeksler `search_logs`
--
ALTER TABLE `search_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_search_logs_query` (`query`),
  ADD KEY `idx_search_logs_created_at` (`created_at`);

--
-- Tablo için indeksler `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`),
  ADD KEY `idx_site_settings_key` (`key`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Tablo için indeksler `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_user_roles_user_id` (`user_id`);

--
-- Tablo için indeksler `view_history`
--
ALTER TABLE `view_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dream_id` (`dream_id`),
  ADD KEY `idx_view_history_user_id` (`user_id`),
  ADD KEY `idx_view_history_viewed_at` (`viewed_at`);

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `blog_comments`
--
ALTER TABLE `blog_comments`
  ADD CONSTRAINT `blog_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `blog_comments` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `blog_comment_likes`
--
ALTER TABLE `blog_comment_likes`
  ADD CONSTRAINT `blog_comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `blog_comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_comment_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `blog_likes`
--
ALTER TABLE `blog_likes`
  ADD CONSTRAINT `blog_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `blog_posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_posts_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`dream_id`) REFERENCES `dreams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `dreams`
--
ALTER TABLE `dreams`
  ADD CONSTRAINT `dreams_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `dream_journal`
--
ALTER TABLE `dream_journal`
  ADD CONSTRAINT `dream_journal_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `dream_likes`
--
ALTER TABLE `dream_likes`
  ADD CONSTRAINT `dream_likes_ibfk_1` FOREIGN KEY (`dream_id`) REFERENCES `dreams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dream_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`dream_id`) REFERENCES `dreams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `search_logs`
--
ALTER TABLE `search_logs`
  ADD CONSTRAINT `search_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `view_history`
--
ALTER TABLE `view_history`
  ADD CONSTRAINT `view_history_ibfk_1` FOREIGN KEY (`dream_id`) REFERENCES `dreams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `view_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
