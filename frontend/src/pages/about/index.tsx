//
// The About page: shows what Graft is, its version, where to find out more and its licence.
//

import { faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar } from "@mui/material";
import { JSX } from "react";
import { version } from "../../lib/version";

//
// Where one of the About page's links goes, what it reads and its data-id.
//
export interface IAboutLinkProps {
    // The web address the link opens.
    href: string;

    // The words of the link.
    label: string;

    // The data-id of the link, so a smoke test can find it.
    dataId: string;
}

//
// Links to a page on the web. It opens in a new window, which the native app hands to the
// system's web browser, so Graft's own window keeps showing Graft.
//
export function AboutLink({ href, label, dataId }: IAboutLinkProps): JSX.Element {
    return (
        <a href={href} target="_blank" rel="noreferrer" data-id={dataId} className="rounded-[var(--radius-sm)] text-[var(--color-accent)] underline decoration-[var(--color-accent)] underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--color-accent-hover)] focus-visible:outline-solid focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[var(--color-focus)]">
            {label}
        </a>
    );
}

//
// Shows Graft's name, version and what it is for, so a user can see what app they are in. Links
// to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube under a "Find out
// more" heading, so they know where to read more about Graft. Names Graft's licence. The icon is
// Graft's mark: a Font Awesome icon in a MaterialUI Avatar, which the style guide theme draws in
// the accent colour. The icon sits beside the name and version so the three read as one header,
// and the heading sizes are the style guide's page title and section heading sizes.
//
export function AboutPage(): JSX.Element {
    return (
        <main data-id="about-page" className="graft-page-in flex max-w-3xl flex-col items-start gap-[var(--space-6)] p-[var(--space-6)]">
            <header data-id="about-header" className="flex items-center gap-[var(--space-4)]">
                <Avatar data-id="about-icon">
                    <FontAwesomeIcon icon={faCodeBranch} />
                </Avatar>
                <div className="flex flex-col gap-[var(--space-1)]">
                    <h1 data-id="about-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                        About Graft
                    </h1>
                    <p data-id="about-version" className="font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                        Version {version}
                    </p>
                </div>
            </header>
            <p data-id="about-description">
                Graft is a simple intuitive Git user-interface to streamline your process instead of getting in your way
            </p>
            <section data-id="about-links-section" className="flex flex-col gap-[var(--space-2)]">
                <h2 data-id="about-links-heading" className="text-[length:var(--text-xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                    Find out more
                </h2>
                <ul data-id="about-links" className="flex flex-col gap-[var(--space-2)]">
                    <li>
                        <AboutLink href="https://github.com/ashleydavis/Graft" label="Graft on GitHub" dataId="about-graft-link" />
                    </li>
                    <li>
                        <AboutLink href="https://github.com/ashleydavis/playbook" label="Playbook on GitHub" dataId="about-playbook-link" />
                    </li>
                    <li>
                        <AboutLink href="https://github.com/ashleydavis/ziggy" label="Ziggy on GitHub" dataId="about-ziggy-link" />
                    </li>
                    <li>
                        <AboutLink href="https://www.youtube.com/@CodeCapers/search?query=Graft" label="The Graft video series on YouTube" dataId="about-videos-link" />
                    </li>
                </ul>
            </section>
            <p data-id="about-licence" className="text-[var(--color-text-muted)]">
                Graft is released under the MIT licence.
            </p>
        </main>
    );
}
