import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | SIA Intelligence Terminal',
  description: 'Terms of Service and User Agreement for SIA Intelligence Terminal',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            Terms of Service
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
              <h3 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h3>
              <p>
                By accessing and using SIA Intelligence Terminal, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Description of Service</h3>
              <p>
                SIA Intelligence Terminal provides market intelligence, analysis, and information services. Our content is generated using AI technology (Gemini 1.5 Pro) and publicly available data (OSINT).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Investment Disclaimer</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ CRITICAL DISCLAIMER - READ CAREFULLY
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>NOT FINANCIAL ADVICE</strong>: Nothing on this website constitutes financial, investment, trading, or legal advice.</li>
                  <li><strong>NO GUARANTEES</strong>: Past performance does not guarantee future results. All predictions are statistical probability analysis only.</li>
                  <li><strong>OSINT ONLY</strong>: All analysis is based on publicly available data. We do not have insider information.</li>
                  <li><strong>CONSULT PROFESSIONALS</strong>: Always consult with qualified financial advisors before making investment decisions.</li>
                  <li><strong>YOUR RESPONSIBILITY</strong>: You are solely responsible for your investment decisions and any resulting gains or losses.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. User Conduct</h3>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use our services for illegal purposes</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Distribute malware or harmful code</li>
                <li>Scrape or copy our content without permission</li>
                <li>Manipulate or interfere with our services</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">5. Intellectual Property</h3>
              <p>
                All content, trademarks, and intellectual property on this website are owned by SIA Intelligence Terminal or our licensors. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIA INTELLIGENCE TERMINAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR INVESTMENTS.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">7. Advertising</h3>
              <p>
                We display advertisements through Google AdSense and other advertising networks. We are not responsible for the content of third-party advertisements.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">8. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Governing Law</h3>
              <p>
                These terms are governed by the laws of Turkey and the European Union. Disputes shall be resolved in the courts of Istanbul, Turkey.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. Contact</h3>
              <p>
                For questions about these terms, contact us at:{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
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
              <h3 className="text-lg font-bold text-white mb-3">1. Şartların Kabulü</h3>
              <p>
                SIA Intelligence Terminal'e erişerek ve kullanarak, bu Kullanım Şartlarını kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız, lütfen hizmetlerimizi kullanmayın.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Hizmet Açıklaması</h3>
              <p>
                SIA Intelligence Terminal, piyasa istihbaratı, analiz ve bilgi hizmetleri sağlar. İçeriğimiz AI teknolojisi (Gemini 1.5 Pro) ve halka açık veriler (OSINT) kullanılarak üretilir.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Yatırım Uyarısı</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ KRİTİK UYARI - DİKKATLE OKUYUN
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>FİNANSAL TAVSİYE DEĞİLDİR</strong>: Bu web sitesindeki hiçbir şey finansal, yatırım, ticaret veya yasal tavsiye niteliği taşımaz.</li>
                  <li><strong>GARANTİ YOKTUR</strong>: Geçmiş performans gelecekteki sonuçları garanti etmez. Tüm tahminler yalnızca istatistiksel olasılık analizidir.</li>
                  <li><strong>SADECE OSINT</strong>: Tüm analizler halka açık verilere dayanır. İçeriden bilgimiz yoktur.</li>
                  <li><strong>PROFESYONELLERE DANIŞIN</strong>: Yatırım kararları vermeden önce her zaman nitelikli finansal danışmanlara danışın.</li>
                  <li><strong>SİZİN SORUMLULUĞUNUZ</strong>: Yatırım kararlarınızdan ve bunların sonucunda oluşan kazanç veya kayıplardan yalnızca siz sorumlusunuz.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">4. Kullanıcı Davranışı</h3>
              <p className="mb-2">Aşağıdakileri yapmamayı kabul edersiniz:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hizmetlerimizi yasadışı amaçlarla kullanmak</li>
                <li>Sistemlerimize yetkisiz erişim sağlamaya çalışmak</li>
                <li>Kötü amaçlı yazılım veya zararlı kod dağıtmak</li>
                <li>İçeriğimizi izinsiz kopyalamak veya çekmek</li>
                <li>Hizmetlerimizi manipüle etmek veya müdahale etmek</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Sorumluluk Sınırlaması</h3>
              <p>
                YASALARIN İZİN VERDİĞİ AZAMİ ÖLÇÜDE, SIA INTELLIGENCE TERMINAL, KAR, VERİ VEYA YATIRIM KAYBI DAHİL OLMAK ÜZERE HİÇBİR DOLAYLI, ARIZİ, ÖZEL, SONUÇ OLARAK ORTAYA ÇIKAN VEYA CEZAİ ZARARLARDAN SORUMLU OLMAYACAKTIR.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Geçerli Hukuk</h3>
              <p>
                Bu şartlar Türkiye ve Avrupa Birliği yasalarına tabidir. Anlaşmazlıklar İstanbul, Türkiye mahkemelerinde çözülecektir.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. İletişim</h3>
              <p>
                Bu şartlarla ilgili sorularınız için bizimle iletişime geçin:{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* German Version */}
        <section id="de" className="mb-16 scroll-mt-8">
          <h2 className="text-2xl font-black text-[#FFB800] uppercase mb-6">🇩🇪 Deutsch</h2>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">1. Annahme der Bedingungen</h3>
              <p>
                Durch den Zugriff auf und die Nutzung von SIA Intelligence Terminal akzeptieren Sie diese Nutzungsbedingungen. Wenn Sie mit diesen Bedingungen nicht einverstanden sind, nutzen Sie bitte unsere Dienste nicht.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Beschreibung des Dienstes</h3>
              <p>
                SIA Intelligence Terminal bietet Marktinformationen, Analysen und Informationsdienste. Unsere Inhalte werden mithilfe von KI-Technologie (Gemini 1.5 Pro) und öffentlich verfügbaren Daten (OSINT) erstellt.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Investitionshinweis</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ WICHTIGER HAFTUNGSAUSSCHLUSS - SORGFÄLTIG LESEN
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>KEINE FINANZBERATUNG</strong>: Nichts auf dieser Website stellt Finanz-, Anlage-, Handels- oder Rechtsberatung dar.</li>
                  <li><strong>KEINE GARANTIEN</strong>: Die vergangene Wertentwicklung ist keine Garantie für zukünftige Ergebnisse. Alle Vorhersagen sind nur statistische Wahrscheinlichkeitsanalysen.</li>
                  <li><strong>NUR OSINT</strong>: Alle Analysen basieren auf öffentlich verfügbaren Daten. Wir haben keine Insiderinformationen.</li>
                  <li><strong>PROFESSIONELLE BERATUNG</strong>: Konsultieren Sie immer qualifizierte Finanzberater, bevor Sie Anlageentscheidungen treffen.</li>
                  <li><strong>IHRE VERANTWORTUNG</strong>: Sie sind allein verantwortlich für Ihre Anlageentscheidungen und alle daraus resultierenden Gewinne oder Verluste.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Haftungsbeschränkung</h3>
              <p>
                IM MAXIMAL GESETZLICH ZULÄSSIGEN UMFANG HAFTET SIA INTELLIGENCE TERMINAL NICHT FÜR INDIREKTE, ZUFÄLLIGE, BESONDERE, FOLGE- ODER STRAFSCHÄDEN, EINSCHLIESSLICH VERLUST VON GEWINNEN, DATEN ODER INVESTITIONEN.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Anwendbares Recht</h3>
              <p>
                Diese Bedingungen unterliegen den Gesetzen der Türkei und der Europäischen Union. Streitigkeiten werden vor den Gerichten in Istanbul, Türkei, beigelegt.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. Kontakt</h3>
              <p>
                Für Fragen zu diesen Bedingungen kontaktieren Sie uns unter:{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
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
              <h3 className="text-lg font-bold text-white mb-3">1. Aceptación de los Términos</h3>
              <p>
                Al acceder y utilizar SIA Intelligence Terminal, acepta y se compromete a cumplir con estos Términos de Servicio. Si no está de acuerdo con estos términos, no utilice nuestros servicios.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Descripción del Servicio</h3>
              <p>
                SIA Intelligence Terminal proporciona inteligencia de mercado, análisis y servicios de información. Nuestro contenido se genera utilizando tecnología de IA (Gemini 1.5 Pro) y datos disponibles públicamente (OSINT).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Descargo de Responsabilidad de Inversión</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ DESCARGO CRÍTICO - LEA CUIDADOSAMENTE
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>NO ES ASESORAMIENTO FINANCIERO</strong>: Nada en este sitio web constituye asesoramiento financiero, de inversión, comercial o legal.</li>
                  <li><strong>SIN GARANTÍAS</strong>: El rendimiento pasado no garantiza resultados futuros. Todas las predicciones son solo análisis de probabilidad estadística.</li>
                  <li><strong>SOLO OSINT</strong>: Todo el análisis se basa en datos disponibles públicamente. No tenemos información privilegiada.</li>
                  <li><strong>CONSULTE PROFESIONALES</strong>: Siempre consulte con asesores financieros calificados antes de tomar decisiones de inversión.</li>
                  <li><strong>SU RESPONSABILIDAD</strong>: Usted es el único responsable de sus decisiones de inversión y de las ganancias o pérdidas resultantes.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Limitación de Responsabilidad</h3>
              <p>
                EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, SIA INTELLIGENCE TERMINAL NO SERÁ RESPONSABLE DE NINGÚN DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE O PUNITIVO, INCLUIDA LA PÉRDIDA DE BENEFICIOS, DATOS O INVERSIONES.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Ley Aplicable</h3>
              <p>
                Estos términos se rigen por las leyes de Turquía y la Unión Europea. Las disputas se resolverán en los tribunales de Estambul, Turquía.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. Contacto</h3>
              <p>
                Para preguntas sobre estos términos, contáctenos en:{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
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
              <h3 className="text-lg font-bold text-white mb-3">1. Acceptation des Conditions</h3>
              <p>
                En accédant et en utilisant SIA Intelligence Terminal, vous acceptez et vous engagez à respecter ces Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. Description du Service</h3>
              <p>
                SIA Intelligence Terminal fournit des services de renseignement de marché, d'analyse et d'information. Notre contenu est généré à l'aide de la technologie IA (Gemini 1.5 Pro) et de données accessibles au public (OSINT).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. Avertissement sur les Investissements</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ AVERTISSEMENT CRITIQUE - LIRE ATTENTIVEMENT
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>PAS DE CONSEIL FINANCIER</strong>: Rien sur ce site web ne constitue un conseil financier, d'investissement, commercial ou juridique.</li>
                  <li><strong>AUCUNE GARANTIE</strong>: Les performances passées ne garantissent pas les résultats futurs. Toutes les prédictions ne sont que des analyses de probabilité statistique.</li>
                  <li><strong>OSINT UNIQUEMENT</strong>: Toutes les analyses sont basées sur des données accessibles au public. Nous n'avons pas d'informations privilégiées.</li>
                  <li><strong>CONSULTEZ DES PROFESSIONNELS</strong>: Consultez toujours des conseillers financiers qualifiés avant de prendre des décisions d'investissement.</li>
                  <li><strong>VOTRE RESPONSABILITÉ</strong>: Vous êtes seul responsable de vos décisions d'investissement et des gains ou pertes qui en résultent.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. Limitation de Responsabilité</h3>
              <p>
                DANS LA MESURE MAXIMALE AUTORISÉE PAR LA LOI, SIA INTELLIGENCE TERMINAL NE SERA PAS RESPONSABLE DES DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, CONSÉCUTIFS OU PUNITIFS, Y COMPRIS LA PERTE DE PROFITS, DE DONNÉES OU D'INVESTISSEMENTS.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. Loi Applicable</h3>
              <p>
                Ces conditions sont régies par les lois de la Turquie et de l'Union européenne. Les litiges seront résolus devant les tribunaux d'Istanbul, Turquie.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. Contact</h3>
              <p>
                Pour toute question concernant ces conditions, contactez-nous à :{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
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
              <h3 className="text-lg font-bold text-white mb-3">1. قبول الشروط</h3>
              <p>
                من خلال الوصول إلى SIA Intelligence Terminal واستخدامه، فإنك تقبل وتوافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">2. وصف الخدمة</h3>
              <p>
                يوفر SIA Intelligence Terminal خدمات استخبارات السوق والتحليل والمعلومات. يتم إنشاء محتوانا باستخدام تقنية الذكاء الاصطناعي (Gemini 1.5 Pro) والبيانات المتاحة للجمهور (OSINT).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">3. إخلاء مسؤولية الاستثمار</h3>
              <div className="p-4 bg-red-900/10 border border-red-900/30">
                <p className="text-yellow-500 font-bold mb-2">
                  ⚠️ إخلاء مسؤولية حرج - اقرأ بعناية
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li><strong>ليست نصيحة مالية</strong>: لا يشكل أي شيء على هذا الموقع نصيحة مالية أو استثمارية أو تجارية أو قانونية.</li>
                  <li><strong>لا ضمانات</strong>: الأداء السابق لا يضمن النتائج المستقبلية. جميع التوقعات هي تحليل احتمالات إحصائية فقط.</li>
                  <li><strong>OSINT فقط</strong>: يستند كل التحليل إلى بيانات متاحة للجمهور. ليس لدينا معلومات داخلية.</li>
                  <li><strong>استشر المحترفين</strong>: استشر دائماً مستشارين ماليين مؤهلين قبل اتخاذ قرارات الاستثمار.</li>
                  <li><strong>مسؤوليتك</strong>: أنت المسؤول الوحيد عن قرارات الاستثمار الخاصة بك وأي مكاسب أو خسائر ناتجة.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">6. حدود المسؤولية</h3>
              <p>
                إلى أقصى حد يسمح به القانون، لن تكون SIA INTELLIGENCE TERMINAL مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، بما في ذلك فقدان الأرباح أو البيانات أو الاستثمارات.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">9. القانون الحاكم</h3>
              <p>
                تخضع هذه الشروط لقوانين تركيا والاتحاد الأوروبي. سيتم حل النزاعات في محاكم إسطنبول، تركيا.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">10. اتصل بنا</h3>
              <p>
                للأسئلة حول هذه الشروط، اتصل بنا على:{' '}
                <a href="mailto:legal@siaintel.com" className="text-[#FFB800] hover:underline">
                  legal@siaintel.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-gray-600">
          <p>
            These terms comply with Turkish Commercial Code, EU regulations, and international standards.
          </p>
          <p className="mt-2">
            By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
          </p>
          <p className="mt-2">
            Complete translations available in 6 languages: English, Turkish, German, Spanish, French, and Arabic.
          </p>
        </div>
      </div>
    </div>
  )
}

