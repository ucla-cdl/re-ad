import { Box, Button, SpeedDial, SpeedDialAction, Typography } from "@mui/material"
import "../styles/Home.css"
import logo from "/re-ad-logo.svg"
import icon from "/re-ad-icon.svg"
import poster from "/poster.png"
import { ArrowUpward, AutoStories, GitHub, Navigation, YouTube } from "@mui/icons-material"
import NotesIcon from '@mui/icons-material/Notes';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ReactMarkdown from 'react-markdown'

export const Home = () => {
    const title = "Bridging Knowledge Gaps Between Cognitive Goals Across Multiple Readings Of Academic Papers";

    const authors = [
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
            name: "Ollie Pai",
            email: "o.pai@ucla.edu",
            affiliation: "University of California, Los Angeles"
        },
        {
            name: "Yuwei Xiao",
            email: "yuweix@ucla.edu",
            affiliation: "University of California, Los Angeles"
        }
    ]

    const description = `Reading academic papers is a fundamental yet challenging task for students and researchers.\
    Beyond text, papers are dense with data, figures, and statistical analyses, requiring readers to extract key insights, synthesize information, and assess evidence across multiple formats.\
    Researchers must also navigate shifting cognitive goals, switching between different reading strategies based on their evolving needs.\
    Moreover, retaining and organizing insights over time remains a persistent challenge, often leading to redundant work and lost understanding upon revisiting papers.\
    While various reading strategies and digital tools exist, they often fail to comprehensively support researchers in managing their reading process and structuring their acquired knowledge.\
    To address these gaps, we propose **re:ad, an interactive reading system designed to help researchers track their reading process, manage cognitive goals, and systematically organize insights**.\
    By providing a structured and dynamic approach to reading, re:ad aims to reduce cognitive overload and enhance the efficiency of engaging with academic literature.`;

    const links = [
        {
            name: "GitHub",
            url: "https://github.com/olliepai/re-ad"
        },
        {
            name: "Blog",
            url: "https://medium.com/@xshaw2002/user-research-blog-augment-data-intensive-reading-d3fd5546ad55"
        },
        {
            name: "Try re:ad",
            url: "./#/papers"
        }
    ]

    const scrollToBlock = (block: string) => {
        document.querySelector(block)?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <Box className="home">
            <Box className="title-block" sx={{ p: 2, gap: 3 }}>
                <img src={logo} alt="logo" style={{ width: "300px" }} />
                <Typography variant="h3" sx={{ textAlign: "center", fontWeight: "bold" }}>
                    {title}
                </Typography>
            </Box>
            <Box className="authors-block">
                {authors.map((author) => (
                    <Box className="author-box" key={author.name}>
                        <Typography variant="h6">
                            {author.name}<sup>*</sup>
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
                <Typography variant="body2">
                    <sup>*</sup>Indicates Equal Contribution
                </Typography>
                <Typography variant="body1">

                </Typography>
            </Box>

            <Box className="links-block" sx={{ my: 2 }}>
                <Button className="link-button" variant="contained" onClick={() => window.open(links[0].url, "_blank")} startIcon={<GitHub />}>
                    Code
                </Button>
                <Button className="link-button" variant="contained" onClick={() => window.open(links[1].url, "_blank")} startIcon={<AutoStories />}>
                    Blog
                </Button>
                <Button className="link-button" variant="contained" onClick={() => window.open(links[2].url, "_blank")} startIcon={<img src={icon} style={{ width: "20px", height: "20px" }} />}>
                    Try re:ad
                </Button>
                <Button
                    className="link-button"
                    variant="contained"
                    onClick={() => scrollToBlock('.poster-block')}
                    startIcon={<ColorLensIcon />}>
                    Poster
                </Button>
                <Button
                    className="link-button"
                    variant="contained"
                    onClick={() => scrollToBlock('.video-block')}
                    startIcon={<YouTube />}>
                    Video
                </Button>
            </Box>

            <Box className="description-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    <b>What is re:ad?</b>
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

            <Box className="poster-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    Poster
                </Typography>
                <Typography variant="body2">
                🏆 Best User Research in CS 239
                </Typography>
                <img className="poster-image" src={poster} alt="poster" />
            </Box>

            <Box className="video-block" sx={{ my: 2 }}>
                <Typography variant="h4">
                    Tutorial Video
                </Typography>
                <iframe
                    src="https://www.loom.com/embed/ef1916f78287477c9aa5f9e31b305e9f?sid=729a2a90-a8b2-4625-8d33-af2bef562dc9"
                    allowFullScreen
                ></iframe>
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