import { useEffect, useRef, useState, useTransition } from "react";
import { getFixedPrizeWinner, getRandomPrizeWinner, getWeightedPrizeWinner } from "../utils/get-prize-winner";
export function useWheelSpin(prizes, onSpinStart, onSpinEnd, animationDurationInMs, wheelRotationsCount, useProbabilitiesToCalculateWinner, defaultWinnerKey) {
    const [, startTransition] = useTransition();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [skipWheelAnimation, setSkipWheelAnimation] = useState(false);
    const winnerRef = useRef(null);
    useEffect(() => {
        let timeout;
        if (isSpinning) {
            setSkipWheelAnimation(true);
            setRotation(0);
            startTransition(() => {
                setSkipWheelAnimation(false);
                calculateSpinParameters();
                timeout = setTimeout(() => {
                    setIsSpinning(false);
                    if (winnerRef.current) {
                        onSpinEnd(winnerRef.current);
                    }
                }, animationDurationInMs);
                if (onSpinStart)
                    onSpinStart();
            });
        }
        return () => {
            clearTimeout(timeout);
        };
    }, [isSpinning]);
    const spin = () => {
        if (isSpinning)
            return;
        setIsSpinning(true);
    };
    const getPrizeWinner = () => {
        if (defaultWinnerKey) {
            return getFixedPrizeWinner(defaultWinnerKey, prizes);
        }
        if (useProbabilitiesToCalculateWinner) {
            return getWeightedPrizeWinner(prizes);
        }
        return getRandomPrizeWinner(prizes);
    };
    const calculateSpinParameters = () => {
        const [winnerIndex, prize] = getPrizeWinner();
        winnerRef.current = prize;
        const fullRotations = 360 * wheelRotationsCount;
        const wheelSegmentDegrees = prizes.length > 0 ? parseFloat((360 / prizes.length).toFixed(4)) : 0;
        const safeZoneMargin = wheelSegmentDegrees * 0.10;
        const randomOffset = Math.random() * (wheelSegmentDegrees - (safeZoneMargin * 2)) + safeZoneMargin;
        const baseAngle = winnerIndex * wheelSegmentDegrees;
        const targetAngle = baseAngle + randomOffset;
        const finalRotation = -(fullRotations + targetAngle);
        setRotation(finalRotation);
    };
    return {
        rotation,
        skipWheelAnimation,
        spin,
    };
}
