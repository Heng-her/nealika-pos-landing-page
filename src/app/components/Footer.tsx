import { Facebook, Instagram, Linkedin, Youtube, Send } from "lucide-react";
import logo from "@/imports/logo-nealika.png";
import abaLogo from "@/imports/aba-logo.png";
import khqrLogo from "@/imports/KHQR.png";
import visaLogo from "@/imports/Visa_Icn-3.png";
import mastercardLogo from "@/imports/Mastercard.png";
import upiLogo from "@/imports/UPI.png";
import jcbLogo from "@/imports/JCB-1.png";
import alipayLogo from "@/imports/Alipay.png";
import wechatLogo from "@/imports/WeChat.png";

export interface FooterProps {
  settings?: {
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_address?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      social_links?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
        telegram?: string;
      };
    };
    social_links?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
      telegram?: string;
    };
  } | null;
}

export default function Footer({ settings }: FooterProps = {}) {
  const contact = settings?.contact;
  const address =
    settings?.contact_address ||
    contact?.address;
  const phone = settings?.contact_phone || contact?.phone;
  const email = settings?.contact_email || contact?.email;

  const socialLinks = settings?.social_links || contact?.social_links;
  const hasSocialSettings =
    socialLinks &&
    Object.values(socialLinks).some(
      (link) => typeof link === "string" && link.trim() !== "",
    );
  return (
    <footer>
      {/* Top Section - Dark Gray */}
      <div
        className="text-white py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#6e6e6e" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Service */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Service</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Hosting and migration
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Domain registered and transferred
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Photography
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Videography
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Graphic design
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Content development
                  </a>
                </li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Mobile Application
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Website development
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Web Application
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Software development
                  </a>
                </li>
              </ul>
            </div>

            {/* Digital Marketing */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Digital Marketing</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    CRM system
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Marketing Automation
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    SEO & SEM
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Social Media
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    SMS Marketing
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    Online Advertisement
                  </a>
                </li>
              </ul>
            </div>

            {/* E-Commerce */}
            <div>
              <h3 className="text-sm font-semibold mb-4">E-Commerce</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    EdTech
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    AgTech
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    E-Tourism
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href="#"
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    E-sport
                  </a>
                </li>
              </ul>
            </div>

            {/* Nealika Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Nealika Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <span>{address}</span>
                </li>
                {contact?.name ? (
                  <li className="flex items-center gap-2">
                    <span className="text-white">▸</span>
                    Name:
                    <span>{contact.name}</span>
                  </li>
                ) : null}
                {phone ? (
                  <li className="flex items-center gap-2">
                    <span className="text-white">▸</span>
                    <span>Tel: {phone}</span>
                  </li>
                ) : null}
                <li className="flex items-center gap-2">
                  <span className="text-white">▸</span>
                  <a
                    href={`mailto:${email}`}
                    className="inline-block hover:underline hover:translate-x-1 transition-all duration-200"
                  >
                    {email}
                  </a>
                </li>
              </ul>
              <div className="flex items-center gap-3 mt-4">
                {hasSocialSettings ? (
                  <>
                    {socialLinks?.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks?.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-pink-400 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks?.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks?.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-red-500 transition-colors"
                      >
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks?.telegram && (
                      <a
                        href={socialLinks.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-blue-400 transition-colors"
                        title="Telegram"
                      >
                        <Send className="w-5 h-5" />
                      </a>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - White */}
      <div className="bg-white py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Logo & Copyright */}
            <div>
              <img src={logo} alt="Nealika" className="h-10 mb-3" />
              <p className="text-sm text-slate-600 mb-1">
                ©2015 - 2026. All Rights Reserved.
              </p>
              <p className="text-sm text-slate-600 mb-2">
                Powered by Nealika Co.,LTD
              </p>
              <div className="flex items-center gap-2 text-sm">
                <a href="#" className="text-blue-600 hover:underline">
                  Terms & Condition
                </a>
                <span className="text-slate-400">-</span>
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Right - Payment Methods */}
            <div className="text-center md:text-right">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                We Accept
              </h4>
              <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
                <img
                  src={abaLogo}
                  alt="ABA"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={khqrLogo}
                  alt="KHQR"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={visaLogo}
                  alt="Visa"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={mastercardLogo}
                  alt="Mastercard"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={upiLogo}
                  alt="UnionPay"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={jcbLogo}
                  alt="JCB"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={alipayLogo}
                  alt="Alipay"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src={wechatLogo}
                  alt="WeChat Pay"
                  className="h-9 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
