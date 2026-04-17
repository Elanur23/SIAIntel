import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | SIA Intelligence Terminal',
  description: 'Privacy Policy and Cookie Policy for SIA Intelligence Terminal - GDPR, KVKK, and Google AdSense compliant',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            Privacy Policy & Cookie Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: March 1, 2026 | Effective Date: March 1, 2026
          </p>
        </div>

        {/* Language Selector */}
        <div className="mb-8 p-4 bg-white/5 border border-white/10">
          <p className="text-xs text-gray-500 mb-2">Available in multiple languages:</p>
          <div className="flex flex-wrap gap-2">
            <a href="#en" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇺🇸 English</a>
            <a href="#tr" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇹🇷 Türkçe</a>
            <a href="#de" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇩🇪 Deutsch</a>
            <a href="#es" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇪🇸 Español</a>
            <a href="#fr" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇫🇷 Français</a>
            <a href="#ar" className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs">🇦🇪 العربية</a>
          </div>
        </div>

        {/* English Version */}
        <section id="en" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇺🇸 English</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Introduction</h3>
              <p>
                Welcome to SIA Intelligence Terminal ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Information We Collect</h3>
              <p className="mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address (for newsletter subscriptions)</li>
                <li>Usage data and analytics</li>
                <li>Device information and IP address</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense and Cookies</h3>
              <p className="mb-2">
                We use Google AdSense to display advertisements on our website. Google AdSense uses cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Serve personalized ads based on your interests</li>
                <li>Measure ad performance and engagement</li>
                <li>Prevent fraud and improve ad quality</li>
              </ul>
              <p className="mt-2">
                You can opt out of personalized advertising by visiting{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Google Ads Settings
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. How We Use Your Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>To provide and maintain our services</li>
                <li>To improve user experience and website functionality</li>
                <li>To display relevant advertisements</li>
                <li>To analyze usage patterns and trends</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Data Processing and Storage</h3>
              <p>
                Your data is processed anonymously and stored securely. We do not sell, trade, or rent your personal information to third parties. Data is retained only as long as necessary for the purposes outlined in this policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Third-Party Services</h3>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google AdSense</strong>: For displaying advertisements</li>
                <li><strong>Google Analytics</strong>: For website analytics</li>
                <li><strong>Gemini AI</strong>: For content generation and analysis</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Your Rights (GDPR/KVKK)</h3>
              <p className="mb-2">Under GDPR and KVKK, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Data portability</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Investment Disclaimer</h3>
              <p className="text-yellow-500 font-bold">
                IMPORTANT: The content provided on this website is for informational purposes only and does not constitute financial, investment, or trading advice. We are not financial advisors. All market analysis, intelligence reports, and predictions are based on publicly available data (OSINT) and statistical probability analysis. Past performance does not guarantee future results. Always consult with a qualified financial advisor before making investment decisions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Contact Us</h3>
              <p>
                For privacy-related inquiries, please contact us at:{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Turkish Version */}
        <section id="tr" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇹🇷 Türkçe</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Giriş</h3>
              <p>
                SIA Intelligence Terminal'e ("biz," "bizim," veya "bize") hoş geldiniz. Bu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı, ifşa ettiğimizi ve koruduğumuzu açıklar.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Topladığımız Bilgiler</h3>
              <p className="mb-2">Doğrudan bize sağladığınız bilgileri topluyoruz:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>E-posta adresi (bülten abonelikleri için)</li>
                <li>Kullanım verileri ve analitikler</li>
                <li>Cihaz bilgileri ve IP adresi</li>
                <li>Çerezler ve benzer izleme teknolojileri</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense ve Çerezler</h3>
              <p className="mb-2">
                Web sitemizde reklam göstermek için Google AdSense kullanıyoruz. Google AdSense, çerezler ve benzer teknolojileri şu amaçlarla kullanır:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>İlgi alanlarınıza göre kişiselleştirilmiş reklamlar sunmak</li>
                <li>Reklam performansını ve etkileşimini ölçmek</li>
                <li>Dolandırıcılığı önlemek ve reklam kalitesini artırmak</li>
              </ul>
              <p className="mt-2">
                Kişiselleştirilmiş reklamlardan{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Google Reklam Ayarları
                </a>{' '}
                sayfasını ziyaret ederek vazgeçebilirsiniz.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. Bilgilerinizi Nasıl Kullanıyoruz</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hizmetlerimizi sağlamak ve sürdürmek için</li>
                <li>Kullanıcı deneyimini ve web sitesi işlevselliğini geliştirmek için</li>
                <li>İlgili reklamları göstermek için</li>
                <li>Kullanım kalıplarını ve trendleri analiz etmek için</li>
                <li>Yasal yükümlülüklere uymak için</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Veri İşleme ve Saklama</h3>
              <p>
                Verileriniz anonim olarak işlenir ve güvenli bir şekilde saklanır. Kişisel bilgilerinizi üçüncü taraflara satmıyor, takas etmiyor veya kiralamıyoruz. Veriler yalnızca bu politikada belirtilen amaçlar için gerekli olduğu sürece saklanır.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Üçüncü Taraf Hizmetler</h3>
              <p className="mb-2">Aşağıdaki üçüncü taraf hizmetlerini kullanıyoruz:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google AdSense</strong>: Reklam gösterimi için</li>
                <li><strong>Google Analytics</strong>: Web sitesi analitikleri için</li>
                <li><strong>Gemini AI</strong>: İçerik üretimi ve analiz için</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Haklarınız (GDPR/KVKK)</h3>
              <p className="mb-2">GDPR ve KVKK kapsamında şu haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Kişisel verilerinize erişim</li>
                <li>Yanlış verilerin düzeltilmesi</li>
                <li>Verilerinizin silinmesini talep etme</li>
                <li>Veri işlemeye itiraz etme</li>
                <li>Veri taşınabilirliği</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Yatırım Uyarısı</h3>
              <p className="text-yellow-500 font-bold">
                ÖNEMLİ: Bu web sitesinde sağlanan içerik yalnızca bilgilendirme amaçlıdır ve finansal, yatırım veya ticaret tavsiyesi niteliği taşımaz. Biz finansal danışman değiliz. Tüm piyasa analizleri, istihbarat raporları ve tahminler halka açık veriler (OSINT) ve istatistiksel olasılık analizine dayanmaktadır. Geçmiş performans gelecekteki sonuçları garanti etmez. Yatırım kararları vermeden önce her zaman nitelikli bir finansal danışmana danışın.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. İletişim</h3>
              <p>
                Gizlilikle ilgili sorularınız için lütfen bizimle iletişime geçin:{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* German, Spanish, French, Arabic versions would follow the same pattern */}
        {/* For brevity, showing structure for one more language */}

        {/* German Version */}
        <section id="de" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇩🇪 Deutsch</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Einführung</h3>
              <p>
                Willkommen bei SIA Intelligence Terminal ("wir", "unser" oder "uns"). Diese Datenschutzrichtlinie erklärt, wie wir Ihre Informationen sammeln, verwenden, offenlegen und schützen, wenn Sie unsere Website besuchen und unsere Dienste nutzen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Gesammelte Informationen</h3>
              <p className="mb-2">Wir sammeln Informationen, die Sie uns direkt zur Verfügung stellen:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>E-Mail-Adresse (für Newsletter-Abonnements)</li>
                <li>Nutzungsdaten und Analysen</li>
                <li>Geräteinformationen und IP-Adresse</li>
                <li>Cookies und ähnliche Tracking-Technologien</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense und Cookies</h3>
              <p className="mb-2">
                Wir verwenden Google AdSense zur Anzeige von Werbung auf unserer Website. Google AdSense verwendet Cookies und ähnliche Technologien für:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Personalisierte Werbung basierend auf Ihren Interessen</li>
                <li>Messung der Anzeigenleistung und des Engagements</li>
                <li>Betrugsprävention und Verbesserung der Anzeigenqualität</li>
              </ul>
              <p className="mt-2">
                Sie können personalisierte Werbung deaktivieren, indem Sie die{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Google Anzeigeneinstellungen
                </a>{' '}
                besuchen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. Verwendung Ihrer Informationen</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Bereitstellung und Wartung unserer Dienste</li>
                <li>Verbesserung der Benutzererfahrung und Website-Funktionalität</li>
                <li>Anzeige relevanter Werbung</li>
                <li>Analyse von Nutzungsmustern und Trends</li>
                <li>Einhaltung gesetzlicher Verpflichtungen</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Datenverarbeitung und Speicherung</h3>
              <p>
                Ihre Daten werden anonym verarbeitet und sicher gespeichert. Wir verkaufen, tauschen oder vermieten Ihre persönlichen Daten nicht an Dritte. Daten werden nur so lange aufbewahrt, wie es für die in dieser Richtlinie beschriebenen Zwecke erforderlich ist.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Drittanbieterdienste</h3>
              <p className="mb-2">Wir verwenden folgende Drittanbieterdienste:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google AdSense</strong>: Für die Anzeige von Werbung</li>
                <li><strong>Google Analytics</strong>: Für Website-Analysen</li>
                <li><strong>Gemini AI</strong>: Für Inhaltserstellung und Analyse</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Ihre Rechte (DSGVO/KVKK)</h3>
              <p className="mb-2">Gemäß DSGVO und KVKK haben Sie das Recht auf:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Zugriff auf Ihre persönlichen Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Widerspruch gegen die Datenverarbeitung</li>
                <li>Datenübertragbarkeit</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Investitionshinweis</h3>
              <p className="text-yellow-500 font-bold">
                WICHTIG: Die auf dieser Website bereitgestellten Inhalte dienen nur zu Informationszwecken und stellen keine Finanz-, Anlage- oder Handelsberatung dar. Wir sind keine Finanzberater. Alle Marktanalysen, Geheimdienstberichte und Vorhersagen basieren auf öffentlich verfügbaren Daten (OSINT) und statistischen Wahrscheinlichkeitsanalysen. Die vergangene Wertentwicklung ist keine Garantie für zukünftige Ergebnisse. Konsultieren Sie immer einen qualifizierten Finanzberater, bevor Sie Anlageentscheidungen treffen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Kontakt</h3>
              <p>
                Für datenschutzbezogene Anfragen kontaktieren Sie uns bitte unter:{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Spanish Version */}
        <section id="es" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇪🇸 Español</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Introducción</h3>
              <p>
                Bienvenido a SIA Intelligence Terminal ("nosotros", "nuestro" o "nos"). Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando visita nuestro sitio web y utiliza nuestros servicios.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Información que Recopilamos</h3>
              <p className="mb-2">Recopilamos información que usted nos proporciona directamente:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Dirección de correo electrónico (para suscripciones al boletín)</li>
                <li>Datos de uso y análisis</li>
                <li>Información del dispositivo y dirección IP</li>
                <li>Cookies y tecnologías de seguimiento similares</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense y Cookies</h3>
              <p className="mb-2">
                Utilizamos Google AdSense para mostrar anuncios en nuestro sitio web. Google AdSense utiliza cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Servir anuncios personalizados según sus intereses</li>
                <li>Medir el rendimiento y la participación de los anuncios</li>
                <li>Prevenir fraudes y mejorar la calidad de los anuncios</li>
              </ul>
              <p className="mt-2">
                Puede optar por no recibir publicidad personalizada visitando{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Configuración de anuncios de Google
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. Cómo Usamos Su Información</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Para proporcionar y mantener nuestros servicios</li>
                <li>Para mejorar la experiencia del usuario y la funcionalidad del sitio web</li>
                <li>Para mostrar anuncios relevantes</li>
                <li>Para analizar patrones y tendencias de uso</li>
                <li>Para cumplir con obligaciones legales</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Procesamiento y Almacenamiento de Datos</h3>
              <p>
                Sus datos se procesan de forma anónima y se almacenan de forma segura. No vendemos, intercambiamos ni alquilamos su información personal a terceros. Los datos se conservan solo durante el tiempo necesario para los fines descritos en esta política.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Servicios de Terceros</h3>
              <p className="mb-2">Utilizamos los siguientes servicios de terceros:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google AdSense</strong>: Para mostrar anuncios</li>
                <li><strong>Google Analytics</strong>: Para análisis del sitio web</li>
                <li><strong>Gemini AI</strong>: Para generación y análisis de contenido</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Sus Derechos (RGPD/KVKK)</h3>
              <p className="mb-2">Según el RGPD y KVKK, usted tiene derecho a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de datos</li>
                <li>Portabilidad de datos</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Descargo de Responsabilidad de Inversión</h3>
              <p className="text-yellow-500 font-bold">
                IMPORTANTE: El contenido proporcionado en este sitio web es solo para fines informativos y no constituye asesoramiento financiero, de inversión o comercial. No somos asesores financieros. Todos los análisis de mercado, informes de inteligencia y predicciones se basan en datos disponibles públicamente (OSINT) y análisis de probabilidad estadística. El rendimiento pasado no garantiza resultados futuros. Siempre consulte con un asesor financiero calificado antes de tomar decisiones de inversión.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Contacto</h3>
              <p>
                Para consultas relacionadas con la privacidad, contáctenos en:{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* French Version */}
        <section id="fr" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇫🇷 Français</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Introduction</h3>
              <p>
                Bienvenue sur SIA Intelligence Terminal ("nous", "notre" ou "nos"). Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web et utilisez nos services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Informations que Nous Collectons</h3>
              <p className="mb-2">Nous collectons les informations que vous nous fournissez directement :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Adresse e-mail (pour les abonnements à la newsletter)</li>
                <li>Données d'utilisation et analyses</li>
                <li>Informations sur l'appareil et adresse IP</li>
                <li>Cookies et technologies de suivi similaires</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense et Cookies</h3>
              <p className="mb-2">
                Nous utilisons Google AdSense pour afficher des publicités sur notre site web. Google AdSense utilise des cookies et des technologies similaires pour :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Diffuser des publicités personnalisées en fonction de vos intérêts</li>
                <li>Mesurer les performances et l'engagement des publicités</li>
                <li>Prévenir la fraude et améliorer la qualité des publicités</li>
              </ul>
              <p className="mt-2">
                Vous pouvez refuser la publicité personnalisée en visitant{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  Paramètres des annonces Google
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. Comment Nous Utilisons Vos Informations</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pour fournir et maintenir nos services</li>
                <li>Pour améliorer l'expérience utilisateur et les fonctionnalités du site web</li>
                <li>Pour afficher des publicités pertinentes</li>
                <li>Pour analyser les modèles et tendances d'utilisation</li>
                <li>Pour se conformer aux obligations légales</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Traitement et Stockage des Données</h3>
              <p>
                Vos données sont traitées de manière anonyme et stockées en toute sécurité. Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Les données ne sont conservées que le temps nécessaire aux fins décrites dans cette politique.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Services Tiers</h3>
              <p className="mb-2">Nous utilisons les services tiers suivants :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google AdSense</strong> : Pour afficher des publicités</li>
                <li><strong>Google Analytics</strong> : Pour les analyses du site web</li>
                <li><strong>Gemini AI</strong> : Pour la génération et l'analyse de contenu</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Vos Droits (RGPD/KVKK)</h3>
              <p className="mb-2">En vertu du RGPD et du KVKK, vous avez le droit de :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Accéder à vos données personnelles</li>
                <li>Rectifier les données inexactes</li>
                <li>Demander la suppression de vos données</li>
                <li>Vous opposer au traitement des données</li>
                <li>Portabilité des données</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Avertissement sur les Investissements</h3>
              <p className="text-yellow-500 font-bold">
                IMPORTANT : Le contenu fourni sur ce site web est uniquement à des fins informatives et ne constitue pas un conseil financier, d'investissement ou commercial. Nous ne sommes pas des conseillers financiers. Toutes les analyses de marché, rapports de renseignement et prédictions sont basés sur des données accessibles au public (OSINT) et une analyse de probabilité statistique. Les performances passées ne garantissent pas les résultats futurs. Consultez toujours un conseiller financier qualifié avant de prendre des décisions d'investissement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Contact</h3>
              <p>
                Pour les demandes liées à la confidentialité, veuillez nous contacter à :{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Arabic Version */}
        <section id="ar" className="mb-16 scroll-mt-8" dir="rtl">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇦🇪 العربية</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. المقدمة</h3>
              <p>
                مرحباً بك في SIA Intelligence Terminal ("نحن" أو "خاصتنا" أو "لنا"). توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والكشف عنها وحمايتها عند زيارة موقعنا واستخدام خدماتنا.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. المعلومات التي نجمعها</h3>
              <p className="mb-2">نجمع المعلومات التي تقدمها لنا مباشرة:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>عنوان البريد الإلكتروني (للاشتراك في النشرة الإخبارية)</li>
                <li>بيانات الاستخدام والتحليلات</li>
                <li>معلومات الجهاز وعنوان IP</li>
                <li>ملفات تعريف الارتباط وتقنيات التتبع المماثلة</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Google AdSense وملفات تعريف الارتباط</h3>
              <p className="mb-2">
                نستخدم Google AdSense لعرض الإعلانات على موقعنا. يستخدم Google AdSense ملفات تعريف الارتباط والتقنيات المماثلة من أجل:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>عرض إعلانات مخصصة بناءً على اهتماماتك</li>
                <li>قياس أداء الإعلانات والتفاعل معها</li>
                <li>منع الاحتيال وتحسين جودة الإعلانات</li>
              </ul>
              <p className="mt-2">
                يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال زيارة{' '}
                <a href="https://www.google.com/settings/ads" className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
                  إعدادات إعلانات Google
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. كيف نستخدم معلوماتك</h3>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>لتوفير خدماتنا والحفاظ عليها</li>
                <li>لتحسين تجربة المستخدم ووظائف الموقع</li>
                <li>لعرض الإعلانات ذات الصلة</li>
                <li>لتحليل أنماط واتجاهات الاستخدام</li>
                <li>للامتثال للالتزامات القانونية</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. معالجة البيانات وتخزينها</h3>
              <p>
                تتم معالجة بياناتك بشكل مجهول وتخزينها بشكل آمن. نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. يتم الاحتفاظ بالبيانات فقط طالما كان ذلك ضرورياً للأغراض الموضحة في هذه السياسة.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. خدمات الطرف الثالث</h3>
              <p className="mb-2">نستخدم خدمات الطرف الثالث التالية:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li><strong>Google AdSense</strong>: لعرض الإعلانات</li>
                <li><strong>Google Analytics</strong>: لتحليلات الموقع</li>
                <li><strong>Gemini AI</strong>: لإنشاء المحتوى وتحليله</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. حقوقك (GDPR/KVKK)</h3>
              <p className="mb-2">بموجب GDPR و KVKK، لديك الحق في:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح البيانات غير الدقيقة</li>
                <li>طلب حذف بياناتك</li>
                <li>الاعتراض على معالجة البيانات</li>
                <li>قابلية نقل البيانات</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. إخلاء مسؤولية الاستثمار</h3>
              <p className="text-yellow-500 font-bold">
                مهم: المحتوى المقدم على هذا الموقع هو لأغراض إعلامية فقط ولا يشكل نصيحة مالية أو استثمارية أو تجارية. نحن لسنا مستشارين ماليين. جميع تحليلات السوق وتقارير الاستخبارات والتوقعات تستند إلى بيانات متاحة للجمهور (OSINT) وتحليل الاحتمالات الإحصائية. الأداء السابق لا يضمن النتائج المستقبلية. استشر دائماً مستشاراً مالياً مؤهلاً قبل اتخاذ قرارات الاستثمار.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. اتصل بنا</h3>
              <p>
                للاستفسارات المتعلقة بالخصوصية، يرجى الاتصال بنا على:{' '}
                <a href="mailto:privacy@siaintel.com" className="text-[#FFB800] hover:underline">
                  privacy@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-gray-600">
          <p>
            This privacy policy is compliant with GDPR (EU), KVKK (Turkey), CCPA (California), and Google AdSense policies.
          </p>
          <p className="mt-2">
            Complete translations available in 6 languages: English, Turkish, German, Spanish, French, and Arabic.
          </p>
        </div>
      </div>
    </div>
  )
}

