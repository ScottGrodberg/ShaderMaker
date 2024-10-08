import { Clock, DoubleSide, NormalBlending, ShaderMaterial } from "three";

export class CylinderRingsMaterial extends ShaderMaterial {

    uniforms = {
        uTime: { value: 0.0 },
        uUvYOffset: { value: 1.0 },
        uXTFactor: { value: 3.0 },
        uXTOffset: { value: 5.0 }
    };

    clock!: Clock;

    vertexShader = `
        uniform float uUvYOffset; 
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vUv.y += uUvYOffset;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    fragmentShader = `
        uniform float uTime;
        uniform float uXTFactor;
        uniform float uXTOffset;
        varying vec2 vUv;
        void main() {
            float r = sin(vUv.y*(uTime*uXTFactor+uXTOffset))*0.5+0.5;
            gl_FragColor = vec4(r,0.0,0.0,r);
        }
    `;

    constructor() {
        super();
        this.setValues({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            blending: NormalBlending,
            side: DoubleSide,
            depthWrite: false
        });
    }

    clone(): this {
        const material = super.clone();
        material.uniforms = JSON.parse(JSON.stringify(this.uniforms));
        material.clock = new Clock();
        material.updateMaterialTime(material.uniforms);
        return material;
    }

    updateMaterialTime(uniforms: any) {
        requestAnimationFrame(() => this.updateMaterialTime(uniforms));
        uniforms.uTime.value = this.clock.getElapsedTime();
    }

}