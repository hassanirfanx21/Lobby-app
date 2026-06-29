import BackButton from "../components/BackButton";

export default function TermsPage() {
  return (
    <div style={{ background: "var(--background)", color: "var(--text-primary)" }}>
      <div className="min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
        <div className="max-w-[680px] mx-auto" style={{ color: "var(--text-primary)" }}>
          <div className="mb-6">
            <BackButton />
          </div>

          <article>
            <h1 style={{ color: "var(--text-primary)", fontSize: 28, marginBottom: 8 }}>
              Lobby — Terms of Service
            </h1>
            <p style={{ color: "var(--text-tertiary)", marginBottom: 18 }}>
              Last updated: [Month Year]
              <br />
              29/06/2026
            </p>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                1. Acceptance
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                By using Lobby, you agree to these Terms. If you do not agree, do not use the app.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                2. What Lobby Is
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby is a member directory and networking tool for communities on Whop. It is an
                independent app, not operated by Whop. Whop's own terms of service apply
                separately to your use of the Whop platform itself.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                3. Your Content
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                You are responsible for whatever you submit to Lobby — your bio, status line,
                tags, boost reasons, and any other content you enter. By submitting content, you
                confirm it does not violate Whop's community guidelines, does not infringe on
                anyone else's rights, and is not false, misleading, or harmful.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                We reserve the right to remove any content that violates these terms or that the
                community owner (creator) flags for moderation, without prior notice.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                4. What Lobby Does Not Do
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby does not verify the accuracy of member-submitted profile information.
                Member bios, status lines, and tags are self-reported. Lobby is not responsible
                for the accuracy or completeness of any member profile.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                5. Availability
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                We provide Lobby on an "as-is" and "as-available" basis. We do not guarantee
                uninterrupted availability and may update, pause, or discontinue the service at
                any time. For paid plans, we will provide reasonable notice before discontinuing
                the service.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                6. Paid Plans
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Community owners may subscribe to Lobby Pro for an additional fee. Billing is
                handled through Whop. All subscription management (upgrades, cancellations,
                refunds) is subject to Whop's billing terms. Lobby Pro access continues until the
                end of the current billing period upon cancellation — no partial refunds are
                issued for unused time.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                7. Limitation of Liability
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                To the fullest extent permitted by law, Lobby and its developers are not liable
                for any indirect, incidental, or consequential damages arising from your use of
                the app, including but not limited to loss of data, loss of revenue, or harm
                arising from interactions with other community members. Our total liability for
                any claim arising from Lobby is limited to the amount you paid us in the 3 months
                prior to the claim.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                8. Changes
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                We may update these Terms from time to time. Continued use of Lobby after
                changes are posted constitutes acceptance. Material changes will be noted by
                updating the "Last updated" date above.
              </p>
            </section>

            <section style={{ marginBottom: 40 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                9. Contact
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Questions about these Terms: embermindofficialx21@gmail.com
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
