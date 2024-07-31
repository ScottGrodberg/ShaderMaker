import { Clock, DoubleSide, NormalBlending, ShaderMaterial } from "three";

export class CylinderRingsMaterial extends ShaderMaterial {

    uniforms = {
        uTime: { value: 0.0 }
    };

    clock!: Clock;
    vertexShader = `
        varying vec3 vUv; 
        void main() {
            vUv = position;      
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    fragmentShader = `
        varying vec3 vUv; 
        void main() {
            float r = sin(vUv.y*15.0)*0.5+0.5;
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