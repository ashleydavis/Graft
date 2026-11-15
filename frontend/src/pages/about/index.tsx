//
// The About page: says what Graft is, with a link to the commits page while a repo is open.
//

import { faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { JSX } from "react";
import { useRepo } from "../../components/repo-context";

//
// Shows Graft's name and what it is for, so a user can see what app they are in. The icon is
// Graft's mark: a Font Awesome icon in a MaterialUI Avatar coloured with a Tailwind class. The link
// to the commits page shows only while a repo is open, so the commit explorer is reached by opening
// a repo.
//
export function AboutPage(): JSX.Element {
    const { repoPath } = useRepo();
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
            {repoPath && <Link to="/commits" data-id="about-commits-link">Commits</Link>}
        </main>
    );
}
