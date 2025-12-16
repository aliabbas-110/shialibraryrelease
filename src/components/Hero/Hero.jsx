import { Typography, Box, Stack, Container } from '@mui/material'

const Hero = () => {
    const NAVBAR_HEIGHT = 80; // match your Navbar height

    return (
        <Container
            id="home"
            sx={{
                pt: `${NAVBAR_HEIGHT}px`, // only padding top, not margin
                mb: 0,
            }}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                sx={{ width: '100%' }}
            >
                <Box
                    sx={{
                        width: { xs: "100%", md: "100%" },
                        padding: '0.5rem 0',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '.5rem',
                        alignItems: 'center',
                        justifyContent: 'flex-start'
                    }}
                >
                    <Typography sx={{ opacity: 0.6, fontSize: 40, mb: 1 }}>﷽</Typography>
                    <Typography sx={{ opacity: 0.6, fontSize: 25, mb: 1 }}>Ya Ali a.s Madad</Typography>
                    <Typography variant="h2" sx={{ fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                        Shia Library
                    </Typography>
                    <Typography sx={{ opacity: 0.7, fontSize: 18 }}>Ghadir Project</Typography>
                </Box>
            </Stack>
        </Container>
    )
}

export default Hero
