//
// The About page: says what Graft is.
//

import { faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar } from "@mui/material";
import { JSX } from "react";

//
// Shows Graft's name and what it is for, so a user can see what app they are in. The icon is
// Graft's mark: a Font Awesome icon in a MaterialUI Avatar coloured with a Tailwind class.
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
            <p data-id="about-description">
                Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way.
            </p>
        </main>
    );
}
