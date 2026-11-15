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
        <a href={href} target="_blank" rel="noreferrer" data-id={dataId} className="text-blue-700 underline dark:text-blue-300">
            {label}
        </a>
    );
}

//
// Shows Graft's name, version and what it is for, so a user can see what app they are in. Links
// to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube, so they can
// find out more. Names Graft's licence. The icon is Graft's mark: a Font Awesome icon in a
// MaterialUI Avatar coloured with a Tailwind class.
//
export function AboutPage(): JSX.Element {
    return (
        <main data-id="about-page" className="flex flex-col items-start gap-4 p-6">
            <Avatar data-id="about-icon" className="bg-emerald-700">
                <FontAwesomeIcon icon={faCodeBranch} />
            </Avatar>
            <h1 data-id="about-heading" className="text-2xl font-bold">
                About Graft
            </h1>
            <p data-id="about-version">
                Version {version}
            </p>
            <p data-id="about-description">
                Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way.
            </p>
            <ul data-id="about-links" className="flex flex-col gap-2">
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
            <p data-id="about-licence">
                Graft is released under the MIT licence.
            </p>
        </main>
    );
}
