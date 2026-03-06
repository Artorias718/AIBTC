import React from "react";
import "./PrivacyPage.css";

const PrivacyPage = () => {
  const year = new Date().getFullYear();

  return (
    <div className="privacy-page">
      <div className="container">
        <div className="privacy-wrapper">
          <p className="privacy-eyebrow">AIBTC for Web</p>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-updated">Updated March 6, {year}</p>

          <section className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy explains how AIBTC ("we," "our," or "us")
              collects, uses, and shares information when you access or use our
              website, interface, and related services (collectively, the
              "Services").
            </p>
            <p>
              AIBTC is a web3 project and interface provider. We do not custody
              your assets, we do not manage your private keys, and we do not
              control public blockchain networks. Because blockchain networks
              are public and permissionless, certain transaction data may be
              visible on-chain to anyone independently of our Services.
            </p>
            <p>
              By using the Services, you acknowledge the practices described in
              this Privacy Policy. If you do not agree, you should not use the
              Services.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Information We Collect</h2>
            <p>
              Because the Services do not require a traditional user account, we
              generally collect less information than centralized platforms.
              Depending on how you use the Services, we may collect the
              following:
            </p>

            <h3>A. Information you provide directly</h3>
            <ul>
              <li>
                Contact information you choose to provide, such as your email
                address when contacting support or sending us an inquiry.
              </li>
              <li>
                Any other information you voluntarily include in messages,
                support requests, or feedback.
              </li>
            </ul>

            <h3>B. Wallet-related information</h3>
            <ul>
              <li>
                Your public wallet address when you connect a wallet to the
                Services.
              </li>
              <li>
                Information about wallet connection status or network selection,
                where necessary to make the interface function correctly.
              </li>
            </ul>

            <h3>C. Technical and usage information</h3>
            <ul>
              <li>
                Browser type, device type, operating system, and screen size.
              </li>
              <li>Pages visited, features used, clicks, and time of access.</li>
              <li>
                Referring pages, basic diagnostics, and error data useful for
                security, debugging, and improving the Services.
              </li>
            </ul>

            <p>
              We do not collect your private keys, seed phrase, or wallet
              password.
            </p>
          </section>

          <section className="privacy-section">
            <h2>3. How We Use Information</h2>
            <p>We may use collected information to:</p>
            <ul>
              <li>Provide, operate, maintain, and improve the Services.</li>
              <li>
                Enable wallet-based functionality and support blockchain-related
                interactions.
              </li>
              <li>
                Monitor performance, fix bugs, detect abuse, and maintain
                security.
              </li>
              <li>Respond to support requests, questions, or feedback.</li>
              <li>
                Comply with legal obligations and enforce our Terms of Service.
              </li>
              <li>
                Analyze usage trends so we can improve content, pages, and user
                experience.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Wallet Addresses and Blockchain Data</h2>
            <p>
              If you connect a wallet, we may process your public wallet address
              to provide the requested functionality of the interface.
            </p>
            <p>
              Please note that blockchain networks are public by nature.
              Transactions submitted through a public blockchain may be publicly
              visible and cannot generally be altered or deleted. Even if you
              request deletion of data we control, we cannot remove or modify
              blockchain records that exist independently on-chain.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Cookies and Analytics</h2>
            <p>
              We may use privacy-friendly analytics tools, local storage, or
              similar technologies to understand how the Services are used and
              to improve performance and usability.
            </p>
            <p>
              These technologies may help us remember interface preferences,
              understand general traffic patterns, measure feature usage, and
              diagnose technical issues.
            </p>
            <p>
              If analytics are enabled on the Services, you may also provide or
              withdraw consent through any available cookie banner, consent
              tool, or analytics preference control made available on the site.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share information
              only in limited circumstances, such as:
            </p>
            <ul>
              <li>
                With service providers that help us operate the Services, such
                as hosting, analytics, infrastructure, security, or support
                providers.
              </li>
              <li>
                If required by law, regulation, subpoena, legal process, or
                governmental request.
              </li>
              <li>
                To protect the rights, safety, security, and integrity of AIBTC,
                the Services, our users, or others.
              </li>
              <li>
                In connection with a business transfer, restructuring, merger,
                financing, or acquisition.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>7. Third-Party Services</h2>
            <p>
              The Services may rely on or link to third-party services,
              including wallet providers, blockchain infrastructure,
              decentralized protocols, analytics tools, social platforms, or
              external websites.
            </p>
            <p>
              Those third parties may collect information independently under
              their own privacy policies and terms. We are not responsible for
              the privacy practices of third-party services.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Data Retention</h2>
            <p>
              We retain information only for as long as reasonably necessary for
              the purposes described in this Privacy Policy, including to
              operate the Services, comply with legal obligations, resolve
              disputes, enforce our agreements, and maintain security.
            </p>
            <p>
              Retention periods may vary depending on the nature of the data and
              the reason it was collected.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Data Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational
              measures intended to protect information under our control.
              However, no method of transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>
            <p>
              You are responsible for protecting your own devices, wallets,
              private keys, seed phrases, and related credentials.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. International Data Transfers</h2>
            <p>
              Depending on where you access the Services from, your information
              may be processed in jurisdictions other than your own. By using
              the Services, you understand that your information may be
              transferred to and processed in countries with different data
              protection rules than those of your place of residence.
            </p>
          </section>

          <section className="privacy-section">
            <h2>11. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have certain privacy
              rights, which can include the right to request access to personal
              data, correction of inaccurate data, deletion of data, restriction
              of processing, or objection to certain uses of data.
            </p>
            <p>
              These rights are not absolute and may be subject to legal
              exceptions. In particular, we cannot modify or delete public
              blockchain data that is not under our control.
            </p>
          </section>

          <section className="privacy-section">
            <h2>12. Children</h2>
            <p>
              The Services are not directed to children, and we do not knowingly
              collect personal information from children. If you believe that a
              child has provided us with personal information, please contact us
              so we can review the situation and take appropriate action.
            </p>
          </section>

          <section className="privacy-section">
            <h2>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will become effective when the revised version is posted on the
              Services, unless otherwise stated. Your continued use of the
              Services after an update means you accept the revised Privacy
              Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
