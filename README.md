🚀 Finansal Otopilot | AI-Powered Personal Finance

Finansal Otopilot, kişisel bütçe yönetimini o eski nesil, sıkıcı ve manuel Excel tablolarından kurtarmak için geliştirdiğim tam donanımlı bir web uygulaması. Amacım sadece gelir-gider kaydeden bir form yapmak değil; arka plandaki Niko yapay zeka motoru sayesinde finansal verileri analiz eden, hedefleri takip eden ve otonom içgörüler sunan akıllı bir asistan yaratmaktı.


🛠️ Neler Kullandım? (Tech Stack)

-Frontend: React.js, Tailwind CSS (Hızlı, dinamik ve modern bir arayüz için)

-Backend: Node.js, Express.js (Uygulamanın motoru)

-Veritabanı: MySQL (İlişkisel veri yönetimi ve güvenli saklama)

-AI Entegrasyonu: OpenAI API (Kullanıcı verilerinden akıllı çıkarımlar yapmak için)

-Deployment (Canlıya Alma): Ubuntu VPS, PM2 (Projeyi 7/24 aslanlar gibi ayakta tutmak için)

💡 Geliştirici Notu


Bu projenin arkasında sadece kod yazmak değil; uzak Linux sunucularında port yapılandırmaları, veritabanı migration süreçleri ve PM2 ile kesintisiz deployment gibi ciddi bir operasyonel süreç yatıyor. Sistemi canlıya alırken karşılaştığım her zorluk ve çözdüğüm her sunucu hatası (özellikle backend-veritabanı haberleşmesindeki o ince detaylar!), full-stack mimarisine olan hakimiyetimi ciddi anlamda test etti ve geliştirdi.

## 🌍 Canlı Demo & Proje Videosu (BTK Hackathon Jürisi İçin Özel Not)
Projeyi değerlendirirken sadece kaynak kodlarına bakmanızı değil, sistemi canlı olarak deneyimlemenizi çok isterim. Bu nedenle projeyi bir Ubuntu VPS sunucusunda yayına aldım. 

* 🔗 **Canlı Sistem:** [http://194.36.85.222](http://194.36.85.222)
*(Önemli Not: Test ortamı olduğu için sisteme henüz bir domain ve SSL sertifikası (HTTPS) tanımlanmamıştır. Bu sebeple tarayıcınız "Güvenli Değil" uyarısı verebilir. Gelişmiş seçeneklerden devam et diyerek test ortamına sorunsuz giriş yapabilirsiniz.)


⚙️ Local Kurulum (Kendi Bilgisayarında Çalıştırmak İçin)

Siber güvenlik prensipleri gereği API anahtarlarım ve veritabanı şifrelerim (.env dosyası) repoda gizlenmiştir. Projeyi lokalde ayağa kaldırmak istersen:

Projeyi klonla.


backend klasörü içine kendi .env dosyanı oluşturup şu değişkenleri kendi sistemine göre tanımla:
DB_HOST, DB_USER, DB_PASSWORD, OPENAI_API_KEY, PORT


Backend ve Frontend klasörlerinde npm install komutuyla paketleri indir.


Gerekli migration dosyalarıyla veritabanı tablolarını oluştur ve sistemi ateşle!

Kodları incelerken bir fikrin olursa, projeyi geliştirmek istersen veya sadece teknoloji & yazılım üzerine sohbet etmek istersen bana buralardan ulaşabilirsin. İyi kodlamalar! ✌️
