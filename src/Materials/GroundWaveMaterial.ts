import { Clock, MeshPhongMaterial, MeshPhongMaterialParameters, NormalBlending, Vector3 } from "three";

export class GroundWaveMaterial extends MeshPhongMaterial {

    uniforms = {
        uDistance: { value: 0.0 },
        uMax: { value: 10.0 },
        uOrigin: { value: new Vector3 }
    };

    clock!: Clock;

    constructor(parameters?: MeshPhongMaterialParameters) {
        super(parameters);
        this.setValues({
            blending: NormalBlending,
            depthWrite: true
        });
        this.onBeforeCompile = (info) => {
            info.vertexShader = info.vertexShader
                .replace('#include <common>', `
                    #include <common>
                    uniform float uDistance;
                    uniform float uMax;
                    uniform vec3 uOrigin;
                `)
                .replace('#include <beginnormal_vertex>', `
                    // // https://www.khanacademy.org/math/multivariable-calculus/integrating-multivariable-functions/line-integrals-in-vector-fields-articles/a/constructing-a-unit-normal-vector-to-curve
                    // float _dist = max - distance; // -time + distance(origin,position);
                    // float mag = sqrt(pow(cos(_dist),2.0) + 1.0 );
                    // float _x = -cos(_dist) / mag;
                    // float _z = 1.0 / mag;
                    vec3 objectNormal = vec3( normal); // (_x,0.0,_z );
                    #ifdef USE_TANGENT
                        vec3 objectTangent = vec3( tangent.xyz );
                    #endif
                `)
                .replace('#include <begin_vertex>', `
                    vec3 _position;
                    float _distance = distance(uOrigin, position);
                    float halfpi = 1.57;
                
                    if (_distance > uMax || _distance > uDistance + halfpi || _distance < uDistance - halfpi) {
                        _position = position;
                    } else {
                       float diff = halfpi - abs(_distance - uDistance);
                        _position = vec3(position.x, position.y, sin(diff));
                    }                    
                    vec3 transformed = _position;
                    #ifdef USE_ALPHAHASH
                        vPosition = _position;
                    #endif
                `);
            info.uniforms.uOrigin = this.uniforms.uOrigin;
            info.uniforms.uDistance = this.uniforms.uDistance;
            info.uniforms.uMax = this.uniforms.uMax;
        };
    }

    clone(): this {
        const material = super.clone();
        material.uniforms = JSON.parse(JSON.stringify(this.uniforms));
        return material;
    }

}