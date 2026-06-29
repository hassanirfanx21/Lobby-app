import Link from "next/link";
import BackButton from "../components/BackButton";

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--background)", color: "var(--text-primary)" }}>
      <div className="min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
        <div className="max-w-[680px] mx-auto" style={{ color: "var(--text-primary)" }}>
          <div className="mb-6">
            <BackButton />
          </div>

          <article style={{ background: "transparent" }}>
            <h1 style={{ color: "var(--text-primary)", fontSize: 28, marginBottom: 8 }}>
              Lobby — Privacy Policy
            </h1>
            <p style={{ color: "var(--text-tertiary)", marginBottom: 18 }}>
              Last updated: [Month Year]
              <br />
              29/06/2026
            </p>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                1. Who We Are
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby is a member directory and discovery tool built for communities on Whop.
                Questions about this policy can be directed to: embermindofficialx21@gmail.com
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                2. What We Collect and Why
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby collects only what is needed to run the directory.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>Profile data</strong> — When you create a Lobby profile, we store your
                name, profile photo URL, username, and join date (pulled from your existing Whop
                account), along with whatever you choose to add: a short bio, interest tags,
                coordination tags, and a status line. This information powers the member directory
                and search.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>Activity data</strong> — When you send a Wave, opt into Buddy Matching,
                boost your profile, or view another member's profile, we store a record of that
                action (who sent it, who received it, and when). This data powers notifications,
                the "who viewed your profile" feature, and the weekly Buddy Match pairing logic.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>Settings and preferences</strong> — We store your in-app privacy
                preferences: whether you allow messages, whether you're open to chat, and whether
                you've opted into Buddy Matching. These control what other members can see about you.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>Billing status</strong> — If you are a community owner (creator) who
                upgrades to Lobby Pro, we store your subscription status and the date of upgrade.
                We do not store payment card details — payments are processed entirely by Whop.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                3. What We Do Not Collect
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                We do not store profile photos directly. Your profile photo is served from
                Whop's own CDN — Lobby only stores the URL that points to it. We do not collect
                email addresses, phone numbers, or any information beyond what is described above.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                4. How Your Data Is Used
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Your data is used solely to operate Lobby's features: showing your profile in
                the directory, matching you with other members, surfacing who viewed your
                profile, and enabling Waves and Boosts. We do not use your data for advertising,
                profiling for third parties, or any purpose unrelated to running the app.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                5. Who Can See Your Data
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Other members of your community can see your public profile (name, photo, bio,
                tags, and status line — subject to your own privacy settings). Profile views,
                Waves you send, and your Buddy Match pairings are visible only to the relevant
                parties. Admin-only data (Insights, Boost management, verified badges) is visible
                only to the community owner.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby does not sell, rent, or share your personal data with any third party for
                commercial purposes.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                6. Third-Party Services
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby is hosted on Vercel (infrastructure) and uses Supabase (database). Your data
                is stored on Supabase servers and processed through Vercel's infrastructure.
                Both providers operate under their own privacy policies and maintain
                industry-standard security practices. Authentication and membership verification
                are handled by Whop — Lobby relies on Whop's existing session tokens and does not
                run a separate login system.
              </p>
            </section>


            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                7. Children
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Lobby is not directed at children under 13. We do not knowingly collect data from
                anyone under 13. If you believe a minor has submitted data, contact us and we
                will remove it promptly.
              </p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                8. Changes to This Policy
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                We may update this policy from time to time. Material changes will be noted by
                updating the "Last updated" date above. Continued use of Lobby after changes
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section style={{ marginBottom: 40 }}>
              <h2 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 6 }}>
                9. Contact
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                For any privacy-related questions or data deletion requests: embermindofficialx21@gmail.com
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
