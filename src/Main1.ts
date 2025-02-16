
import { CameraManMain } from "./Camera/CameraManMain";
import { Data } from "./Data";
import { GameEngine } from "./GameEngine";
import { FogExpOverride } from "./Materials/FogExpOverride";
import { CylinderOnPlane } from "./Scenes/CylinderOnPlane";
import { CylinderOnPlane2 } from "./Scenes/CylinderOnPlane2";
import { DropZone } from "./Scenes/DropZone";
import { FogScene } from "./Scenes/FogScene";
import { Forge } from "./Scenes/Forge";
import { GradientTextureScene } from "./Scenes/GradientTextureScene";
import { PlaneShockWave } from "./Scenes/PlaneShockWave";
import { PlaneShockWavePulse } from "./Scenes/PlaneShockWavePulse";
import { Screenshot } from "./Scenes/Screenshot";
import { TubePulseOnPlane } from "./Scenes/TubePulseOnPlane";

// MAIN 
console.clear();

window.addEventListener("DOMContentLoaded", async () => {

    const canvas = document.getElementById("elementDungeon") as HTMLCanvasElement;
    const data = new Data(canvas)
    const cameraManMain = new CameraManMain(data);

    const gameEngine = new GameEngine(data, canvas, cameraManMain);
    gameEngine.init();

    switch (window.location.hash.substring(1)) {
        case "CylinderOnPlane":
            new CylinderOnPlane().go(data, cameraManMain);
            break;
        case "CylinderOnPlane2":
            new CylinderOnPlane2().go(data, cameraManMain);
            break;
        case "DropZone":
            new DropZone().go(data, cameraManMain);
            break;
        case "Forge":
            new Forge().go(data, cameraManMain);
            break;
        case "PlaneShockWave":
            new PlaneShockWave().go(data, cameraManMain);
            break;
        case "PlaneShockWavePulse":
            new PlaneShockWavePulse().go(data, cameraManMain);
            break;
        case "TubePulseOnPlane":
            new TubePulseOnPlane().go(data, cameraManMain);
            break;
        case "FogScene": {
            const fogScene = new FogScene();
            const fogExpOverride = new FogExpOverride();
            fogScene.go(data, cameraManMain, fogExpOverride);
            break;
        }
        case "GradientTextureScene":
            new GradientTextureScene().go(data, cameraManMain);
            break;

        case "Screenshot":
            new Screenshot(data).go(cameraManMain);
            break;
    }

});

