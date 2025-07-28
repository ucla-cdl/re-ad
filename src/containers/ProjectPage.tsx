import { Box, Button, SpeedDial, SpeedDialAction, Typography } from "@mui/material"
import "../styles/Home.css"
import icon from "/re-ad-icon.svg"
import poster from "/poster.png"
import { ArrowUpward, AutoStories, GitHub, Navigation, YouTube } from "@mui/icons-material"
import NotesIcon from '@mui/icons-material/Notes';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ReactMarkdown from 'react-markdown'

export const Home = () => {
    const title = "ReadFlect: Scaffolding Intent-Driven, Multi-Session and Reflective Reading of Academic Papers";

    const authors = [
        {
            name: "Yuwei Xiao",
            email: "yuweix@ucla.edu",
            affiliation: "University of California, Los Angeles"
        },
        {
            name: "Ollie Pai",
            email: "o.pai@ucla.edu",
            affiliation: "University of California, Los Angeles"
        },
        {
            name: "Brian Roysar",
            email: "brianroysar@ucla.edu",
            affiliation: "University of California, Los Angeles"
        },
        {
            name: "Michael Shi",
            email: "michaelshi@g.ucla.edu",
            affiliation: "University of California, Los Angeles"
        },
        {
            name: "Eunice Jun",
            email: "emjun@ucla.edu",
            affiliation: "University of California, Los Angeles"
        }
    ]

    const description = `Reading academic papers is a fundamental yet challenging task for students and researchers.\
    Beyond text, papers are dense with data, figures, and statistical analyses, requiring readers to extract key insights, synthesize information, and assess evidence across multiple formats.\
    Researchers must also navigate shifting cognitive goals, switching between different reading strategies based on their evolving needs.\
    Moreover, retaining and organizing insights over time remains a persistent challenge, often leading to redundant work and lost understanding upon revisiting papers.\
    While various reading strategies and digital tools exist, they often fail to comprehensively support researchers in managing their reading process and structuring their acquired knowledge.\
    \n\nTo address these gaps, we present **ReadFlect**, an interactive system that **scaffolds intent-driven, multi-session and reflective reading of academic literature**.\
    ReadFlect enables users to define and manage reading intentions, annotate papers in context, and externalize insights through a diagramming canvas.\
    It further supports reflection through visual analytics that capture reading behaviors over time.\
    By doing so, ReadFlect aims to foster more structured engagement with scientific literature, enhance comprehension, facilitate synthesis, and support collaborative and pedagogical scenarios.`;

    const links = [
        {
            name: "GitHub",
            url: "https://github.com/ucla-cdl/re-ad"
        },
        {
            name: "Blog",
            url: "https://medium.com/@xshaw2002/user-research-blog-augment-data-intensive-reading-d3fd5546ad55/preview"
        },
        {
            name: "Try ReadFlect",
            url: "./#/papers"
        }
    ]

    const VIDEO_URL = "https://drive.google.com/file/d/1MysOo8PKdM1bXcQ9CRU0GmFwAZ2jyBoE/preview";

    const scrollToBlock = (block: string) => {
        document.querySelector(block)?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <Box className="home">
            <Box className="title-block" sx={{ display: "flex", flexDirection: "row", alignItems: "center", p: 2, gap: 1.5 }}>
                <img src={icon} alt="logo" style={{ width: "80px" }} />
                <Typography variant="h4" sx={{ textAlign: "center", fontWeight: "bold" }}>
                    {title}
                </Typography>
            </Box>
            <Box className="authors-block">
                {authors.map((author) => (
                    <Box className="author-box" key={author.name}>
                        <Typography variant="h6">
                            {author.name}
                        </Typography>
                        <Typography variant="body1">
                            {author.email}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box className="information-block">
                <Typography variant="h6">
                    {Array.from(new Set(authors.map(author => author.affiliation))).join(", ")}
                </Typography>
            </Box>

            <Button variant="contained"
                sx={{ my: 1, border: "2px solid black", borderRadius: 5, p: 2, bgcolor: "#ffffff", color: "#000000", fontSize: "1rem" }}
                onClick={() => window.open(links[2].url, "_blank")}
                startIcon={<img src={icon} style={{ width: "35px", height: "35px" }} />}>
                Try ReadFlect
            </Button>

            <Box className="links-block" sx={{ my: 1 }}>
                <Button className="link-button" variant="contained" onClick={() => window.open(links[0].url, "_blank")} startIcon={<GitHub />}>
                    Code
                </Button>
                <Button className="link-button" variant="contained" onClick={() => window.open(links[1].url, "_blank")} startIcon={<AutoStories />}>
                    Blog
                </Button>
                <Button
                    className="link-button"
                    variant="contained"
                    onClick={() => scrollToBlock('.video-block')}
                    startIcon={<YouTube />}>
                    Video
                </Button>
                <Button
                    className="link-button"
                    variant="contained"
                    onClick={() => scrollToBlock('.poster-block')}
                    startIcon={<ColorLensIcon />}>
                    Poster
                </Button>
            </Box>

            <Box className="description-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    <b>What is ReadFlect?</b>
                </Typography>
                <ReactMarkdown components={{
                    p: ({ children }) => (
                        <Typography variant="body1" sx={{ lineHeight: 2, my: 2 }}>
                            {children}
                        </Typography>
                    )
                }}>
                    {description}
                </ReactMarkdown>
            </Box>

            <Box className="video-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    Demo Video
                </Typography>
                <iframe
                    src={VIDEO_URL}
                    allowFullScreen
                ></iframe>
            </Box>

            <Box className="poster-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    Poster
                </Typography>
                <Typography variant="body2">
                    🏆 Best User Research in UCLA CS 239 Winter 2025
                </Typography>
                <img className="poster-image" src={poster} alt="poster" />
            </Box>

            <SpeedDial
                ariaLabel="Navigation SpeedDial"
                sx={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                }}
                icon={<Navigation />}
            >
                <SpeedDialAction
                    key="top"
                    icon={<ArrowUpward />}
                    tooltipTitle="Back to Top"
                    onClick={() => scrollToBlock('.title-block')}
                />
                <SpeedDialAction
                    key="video"
                    icon={<YouTube />}
                    tooltipTitle="Go to Video"
                    onClick={() => scrollToBlock('.video-block')}
                />
                <SpeedDialAction
                    key="poster"
                    icon={<ColorLensIcon />}
                    tooltipTitle="Go to Poster"
                    onClick={() => scrollToBlock('.poster-block')}
                />
                <SpeedDialAction
                    key="description"
                    icon={<NotesIcon />}
                    tooltipTitle="Go to Description"
                    onClick={() => scrollToBlock('.description-block')}
                />
            </SpeedDial>
        </Box>
    )
}