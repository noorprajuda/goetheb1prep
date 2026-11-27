"use client";

import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/register"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back_to_registration")}
          </Link>
          
          <div className="flex items-center mb-4">
            <Image
              src="/favicon.ico"
              alt="Goethe B1 Prep"
              width={40}
              height={40}
              className="mr-3"
            />
            <h1 className="text-3xl font-bold text-gray-900">
              {t("privacy.title")}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t("privacy.last_updated")}
            </h2>
            <p className="text-gray-600 mb-8">
              {t("privacy.last_updated_date")}
            </p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.introduction.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.introduction.content")}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.data_collection.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.data_collection.content")}
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>{t("privacy.data_collection.personal_info")}</li>
                <li>{t("privacy.data_collection.usage_data")}</li>
                <li>{t("privacy.data_collection.audio_recordings")}</li>
                <li>{t("privacy.data_collection.payment_info")}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.email_communications.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.email_communications.content")}
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>{t("privacy.email_communications.account_updates")}</li>
                <li>{t("privacy.email_communications.learning_tips")}</li>
                <li>{t("privacy.email_communications.promotional_content")}</li>
                <li>{t("privacy.email_communications.system_notifications")}</li>
              </ul>
              <p className="text-gray-700 mb-4">
                {t("privacy.email_communications.consent")}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.data_usage.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.data_usage.content")}
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>{t("privacy.data_usage.service_provision")}</li>
                <li>{t("privacy.data_usage.personalization")}</li>
                <li>{t("privacy.data_usage.analytics")}</li>
                <li>{t("privacy.data_usage.communication")}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.data_sharing.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.data_sharing.content")}
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>{t("privacy.data_sharing.service_providers")}</li>
                <li>{t("privacy.data_sharing.legal_requirements")}</li>
                <li>{t("privacy.data_sharing.business_transfer")}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.data_security.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.data_security.content")}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.your_rights.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.your_rights.content")}
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>{t("privacy.your_rights.access")}</li>
                <li>{t("privacy.your_rights.correction")}</li>
                <li>{t("privacy.your_rights.deletion")}</li>
                <li>{t("privacy.your_rights.portability")}</li>
                <li>{t("privacy.your_rights.withdraw_consent")}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.cookies.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.cookies.content")}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.changes.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.changes.content")}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("privacy.contact.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("privacy.contact.content")}
              </p>
              <p className="text-gray-700">
                <strong>{t("privacy.contact.email")}:</strong> privacy@demomailtrap.co
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
