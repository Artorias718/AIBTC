import type { WheelOfFortunePrize } from "../types/wheel-of-fortune-prize";
/**
 * Props for the Wheel of Fortune component
 * @type {WheelOfFortuneProps}
 *
 * @property {WheelOfFortunePrize[]} prizes - Array of prizes to display on the wheel
 * @property {React.ReactNode} wheelPointer - Custom wheel pointer component
 * @property {React.ReactNode} wheelSpinButton - Custom button component to trigger the wheel spin
 * @property {(prize: WheelOfFortunePrize) => void} onSpinEnd - Callback function executed when spinning animation ends
 * @property {() => void} [onSpinStart] - Optional callback function executed when spinning starts
 * @property {string} [wheelBorderColor] - Optional color for the wheel border. Accepts RGB, HSL, or HEX format
 * @property {number} [animationDurationInMs=5000] - Optional duration of spinning animation in milliseconds. Default: 5000
 * @property {number} [wheelRotationsCount=5] - Optional number of full rotations before stopping. Default: 5
 * @property {boolean} [useProbabilitiesToCalculateWinner=false] - Optional flag to use prize probabilities for winner calculation. Default: false
 * @property {string} [defaultWinnerKey] - Optional key to force a specific prize to win
 * @property {string} [className] - Optional CSS class name for styling
 */
export type WheelOfFortuneProps = {
    prizes: WheelOfFortunePrize[];
    wheelPointer: React.ReactNode;
    wheelSpinButton: React.ReactNode;
    onSpinEnd: (prize: WheelOfFortunePrize) => void;
    onSpinStart?: () => void;
    wheelBorderColor?: `rgb(${number}, ${number}, ${number})` | `hsl(${number}, ${number}%, ${number}%)` | `#${string}`;
    animationDurationInMs?: number;
    wheelRotationsCount?: number;
    useProbabilitiesToCalculateWinner?: boolean;
    defaultWinnerKey?: string;
    className?: string;
};
/**
 * Interface representing the exposed ref methods for the Wheel of Fortune component.
 *
 * @interface WheelOfFortuneRef
 *
 * @property {() => void} spin - Method to trigger the wheel spinning animation.
 */
export interface WheelOfFortuneRef {
    spin: () => void;
}
export declare const WheelOfFortune: import("react").ForwardRefExoticComponent<WheelOfFortuneProps & import("react").RefAttributes<WheelOfFortuneRef>>;
