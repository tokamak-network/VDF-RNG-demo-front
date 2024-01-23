import Round from "../components/Round"
import Commit from "../components/Commit"
import { useMoralis } from "react-moralis"
import { useState, useEffect } from "react"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "./../constants"
import Moment from "react-moment"
import { useInterval } from "use-interval"
import { Widget, useNotification } from "web3uikit"
import RankOfEachParticipants from "../components/RankOfEachParticipants"
import { ethers } from "ethers"

const supportedChains = ["31337", "11155111"]

export default function Home() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const randomAirdropAddress =
        chainId in contractAddresses
            ? contractAddresses[chainId][contractAddresses[chainId].length - 1]
            : null
    let [round, setRound] = useState(0)
    const [isSetUp, setIsSetUp] = useState(false)
    const [isCommit, setIsCommit] = useState(false)
    const [settedUpValues, setSettedUpValues] = useState({})
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [started, setStarted] = useState("")
    const [participatedRoundsLength, setParticipatedRoundsLength] = useState()
    const [participatedRounds, setParticipatedRounds] = useState([])
    const [nextRound, setNextRound] = useState()
    const dispatch = useNotification()
    function str_pad_left(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length)
    }
    const { runContractFunction: registerNextRound, isLoading } = useWeb3Contract()
    const [isFetching, setIsFetching] = useState(false)
    const { runContractFunction: getParticipantsLengthAtRound } = useWeb3Contract()
    const { runContractFunction: getNextRound } = useWeb3Contract({
        abi: abi,
        contractAddress: randomAirdropAddress, //,
        functionName: "getNextRound", //,
        params: {},
    })
    async function getRankPointOfEachParticipantsFunction() {
        setIsFetching(true)
        // const provider = new ethers.BrowserProvider(window.ethereum)
        // const randomAirdropContract = new ethers.Contract(randomAirdropAddress, abi, provider)
        // let gasEstimate = await randomAirdropContract.registerNextRound.estimateGas()
        // console.log(gasEstimate)
        // const signer = await provider.getSigner()
        // console.log(
        //     await randomAirdropContract.connect(signer).registerNextRound.populateTransaction()
        // )
        // const data = await randomAirdropContract
        //     .connect(signer)
        //     .registerNextRound({ gasLimit: Number(gasEstimate) * 1.5 })
        // console.log(data)
        const registerNextRoundOptions = {
            abi: abi,
            contractAddress: randomAirdropAddress,
            functionName: "registerNextRound",
            params: {},
        }
        await registerNextRound({
            params: registerNextRoundOptions,
            onSuccess: handleSuccess,
            onError: (error) => {
                console.log(error)
                setIsFetching(false)
                dispatch({
                    type: "error",
                    message:
                        error?.data && error.data.message?.includes("gas required exceeds")
                            ? "already registered"
                            : error?.error?.message && error.error.message != "execution reverted"
                            ? error.error.message
                            : error.error
                            ? new ethers.Interface(abi).parseError(
                                  error.error.data.originalError.data
                              ).name
                            : error?.data?.message,
                    title: "Error Message",
                    position: "topR",
                    icon: "bell",
                })
            },
        })
    }
    const handleSuccess = async function (tx) {
        await tx.wait(1)
        setIsFetching(false)
        handleNewNotification(tx)
    }
    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Completed",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }
    useInterval(() => {
        let commitDurationInt
        if (settedUpValues.commitDuration) {
            commitDurationInt = parseInt(settedUpValues.commitDuration)
            if (commitDurationInt > 0) {
                let _timeRemaing =
                    commitDurationInt -
                    (Math.floor(Date.now() / 1000) - parseInt(settedUpValues.setUpTime))
                const minutes = Math.floor(_timeRemaing / 60)
                const seconds = _timeRemaing - minutes * 60
                if (_timeRemaing > -1)
                    setTimeRemaining(
                        str_pad_left(minutes, "0", 2) + ":" + str_pad_left(seconds, "0", 2)
                    )
            }
        }
    }, 1000)
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled, round])
    useInterval(() => {
        updateUI()
    }, 12000)
    const { runContractFunction: getSetUpValuesAtRound } = useWeb3Contract()
    const { runContractFunction: randomAirdropRound } = useWeb3Contract({
        abi: abi,
        contractAddress: randomAirdropAddress, //,
        functionName: "randomAirdropRound", //,
        params: {},
    })
    const { runContractFunction: getParticipatedRounds } = useWeb3Contract({
        abi: abi,
        contractAddress: randomAirdropAddress, //,
        functionName: "getParticipatedRounds", //,
        params: {},
    })

    async function updateUI() {
        let roundFromCall = await randomAirdropRound({ onError: (error) => console.log(error) })
        let nextRoundFromCall = await getNextRound({ onError: (error) => console.log(error) })
        setNextRound(nextRoundFromCall?.toString())
        if (roundFromCall === undefined) roundFromCall = 0
        setRound(roundFromCall.toString())
        const participantsLengthfromCallOptions = {
            abi: abi,
            contractAddress: randomAirdropAddress,
            functionName: "getParticipantsLengthAtRound",
            params: { _round: nextRoundFromCall },
        }
        const participantsLengthfromCall = await getParticipantsLengthAtRound({
            params: participantsLengthfromCallOptions,
            onError: (error) => console.log(error),
        })
        setParticipatedRoundsLength(participantsLengthfromCall?.toString())
        const participatedRoundsfromCall = await getParticipatedRounds({
            onError: (error) => console.log(error),
        })
        let temp = []

        if (participatedRoundsfromCall) {
            for (let i = 0; i < participatedRoundsfromCall.length; i++) {
                temp.push(participatedRoundsfromCall[i].toString())
            }
            setParticipatedRounds(temp)
        }
        await getGetSetUpValuesAtRound(roundFromCall)
        if (settedUpValues.setUpTime !== undefined && settedUpValues.setUpTime != "0") {
            setIsSetUp(true)
            setIsCommit(true)
            setStarted("Started!")
        } else {
            setIsSetUp(false)
            setIsCommit(true)
            setStarted("Not Started")
        }
    }
    async function getGetSetUpValuesAtRound(roundFromCall) {
        const setUpValuesAtRoundOptions = {
            abi: abi,
            contractAddress: randomAirdropAddress,
            functionName: "getSetUpValuesAtRound",
            params: { _round: roundFromCall },
        }
        const result = await getSetUpValuesAtRound({
            params: setUpValuesAtRoundOptions,
            onError: (error) => console.log(error),
        })
        if (result === undefined) return
        setSettedUpValues({
            T: result["T"].toString(),
            n: result["n"]["val"].toString(),
            nl: result["n"]["bitlen"].toString(),
            g: result["g"]["val"].toString(),
            gl: result["g"]["bitlen"].toString(),
            h: result["h"]["val"].toString(),
            hl: result["h"]["bitlen"].toString(),
            commitDuration: result["commitDuration"].toString(),
            commitRevealDuration: result["commitRevealDuration"].toString(),
            setUpTime: result["setUpTime"].toString(),
        })
    }
    return (
        <div className="bg-slate-50	opacity-80 min-h-screen bg-repeat-y bg-cover bg-center py-10">
            <div
                style={{ minWidth: "852px" }}
                className="bg-white	container mx-auto w-6/12 rounded-3xl border-dashed border-amber-950 border-2"
            >
                <Round round={round} />
                {randomAirdropAddress ? (
                    <div>
                        <div className="p-5">
                            <div className="border-dashed border-amber-950 border-2 rounded-lg p-10">
                                <div className="mb-2 font-bold">
                                    Register For Round{" "}
                                    <span className="font-black">{nextRound}</span>
                                </div>
                                <button
                                    id="enterEventByCommit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded ml-auto mt-7"
                                    disabled={isLoading || isFetching}
                                    type="button"
                                    onClick={getRankPointOfEachParticipantsFunction}
                                >
                                    {isLoading || isFetching ? (
                                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                    ) : (
                                        <div>Register</div>
                                    )}
                                </button>
                                <div className="pt-2">
                                    Number of participants registered :
                                    <span className="font-bold"> {participatedRoundsLength}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <RankOfEachParticipants
                                round={round}
                                participatedRounds={participatedRounds}
                            />
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    )
}
