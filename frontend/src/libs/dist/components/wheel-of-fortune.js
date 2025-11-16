import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useImperativeHandle } from "react";
import { twMerge } from "tailwind-merge";
import { generateWheelGradient } from "../utils/wheel-gradient";
import { useWheelSpin } from "../hooks/use-wheel-spin";
;
export const WheelOfFortune = forwardRef((props, ref) => {
    const { prizes, wheelPointer, wheelSpinButton, onSpinEnd, onSpinStart = () => { }, wheelBorderColor = "#FFFFFF", animationDurationInMs = 5000, wheelRotationsCount = 5, useProbabilitiesToCalculateWinner = false, defaultWinnerKey = "", className } = props;
    const wheelSegmentDegrees = prizes.length > 0 ? parseFloat((360 / prizes.length).toFixed(4)) : 0;
    const animationDurationInSeconds = Math.round(animationDurationInMs / 1000);
    const wheelGradient = generateWheelGradient(prizes, wheelSegmentDegrees);
    const { rotation, skipWheelAnimation, spin } = useWheelSpin(prizes, onSpinStart, onSpinEnd, animationDurationInMs, wheelRotationsCount, useProbabilitiesToCalculateWinner, defaultWinnerKey);
    useImperativeHandle(ref, () => ({
        spin,
    }));
    return (_jsx("div", { className: twMerge("relative max-w-96 w-full flex flex-col justify-center items-center", className), children: _jsxs("div", { className: "relative w-full aspect-square", children: [wheelPointer && _jsx("div", { className: "absolute top-[-4px] left-[50%] translate-x-[-50%] z-10", children: wheelPointer }), _jsx("div", { className: "absolute top-0 left-0 w-full h-full overflow-hidden rounded-[50%] border-10", style: {
                        boxShadow: 'box-shadow: 0 0 20px rgba(0, 0, 0, 0.25), inset 0 0 10px rgba(0, 0, 0, 0.3)',
                        borderColor: wheelBorderColor,
                        background: wheelGradient,
                        transform: `rotate(${rotation}deg)`,
                        transition: skipWheelAnimation ? 'none' : `transform ${animationDurationInSeconds}s ease-out`
                    }, children: prizes.map((item, index) => (_jsx("div", { className: "absolute top-0 left-0 w-full h-full origin-center flex justify-center text-center", style: {
                            transform: `rotate(${wheelSegmentDegrees * index + wheelSegmentDegrees / 2}deg)`
                        }, children: _jsx("div", { style: { rotate: item.displayOrientation === 'horizontal' ? '270deg' : '0deg', top: item.displayOrientation === 'horizontal' ? '15%' : '10%' }, className: "absolute overflow-hidden text-ellipsis", children: item.prize }) }, item.key))) }), wheelSpinButton && _jsx("div", { className: "absolute z-10 top-0 left-0 w-full h-full flex items-center justify-center", children: wheelSpinButton })] }) }));
});
WheelOfFortune.displayName = "WheelOfFortune";
