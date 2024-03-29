import "../styles/globals.css"
import { MoralisProvider } from "react-moralis"
import { NotificationProvider } from "web3uikit"
import type { AppProps } from "next/app"
import Head from "next/head"

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <MoralisProvider initializeOnMount={false}>
                <NotificationProvider>
                    <Head>
                        <title>TON Random Airdrop</title>
                        <meta name="description" content="RandomAirdrop using Commit-Recover" />
                        <link rel="icon" href="../tokamaklogo.png" />
                    </Head>
                    <Component {...pageProps} />
                </NotificationProvider>
            </MoralisProvider>
        </>
    )
}

export default MyApp
// initializeonMount : is the optionality to hook into a server to add some more features to our website.
