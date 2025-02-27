import { Clock, ShaderMaterial, Vector3 } from "three";

export class ExtrusionMaterial extends ShaderMaterial {

    uniforms = {
        uY: { value: 3.0 },
        uColor: { value: new Vector3(1.0, 1.0, 1.0) },
    };

    clock!: Clock;

    vertexShader = `
        varying vec4 vPosition;
        void main(void) {
            vPosition =  modelViewMatrix * vec4(position,1.0);
            gl_Position = projectionMatrix * vPosition;
        }
    `;
    fragmentShader = `
        varying vec4 vPosition;
        uniform float uY;
        uniform vec3 uColor;

        void main(void) {
            vec3 color = vec3(0.0);
            color.r =step(0.0,vPosition.x);
            color.g =step(0.0,vPosition.y);
            color.b =step(0.0,vPosition.z);
            
            if (vPosition.y > uY) {
                discard;
            }
            gl_FragColor = vec4(uColor,1.0);
        }
    `;

    clone(): this {
        const material = super.clone();
        material.uniforms = JSON.parse(JSON.stringify(this.uniforms));
        return material;
    }
}

