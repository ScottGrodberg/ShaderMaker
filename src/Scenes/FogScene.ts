import GUI from "lil-gui";
import { AmbientLight, BoxGeometry, Color, DirectionalLight, FogExp2, Mesh, MeshStandardMaterial, ShaderChunk } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { Utility } from "../Utilities/Utility";


export class FogScene {

    _NOISE_GLSL = `
    //
    // Description : Array and textureless GLSL 2D/3D/4D simplex
    //               noise functions.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : stegu
    //     Lastmod : 20201014 (stegu)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    //               https://github.com/stegu/webgl-noise
    //
    
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
         return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v)
    {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
    
    // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
    
      //   x0 = x0 - 0.0 + 0.0 * C.xxx;
      //   x1 = x0 - i1  + 1.0 * C.xxx;
      //   x2 = x0 - i2  + 2.0 * C.xxx;
      //   x3 = x0 - 1.0 + 3.0 * C.xxx;
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    
    // Permutations
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    
    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;
    
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
    
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
    
      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
    
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
    
    //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
    
    // Mix final noise value
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    float FBM(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for (int i = 0; i < 6; ++i) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    `;

    interval?: number;
    shaders = new Array<any>();
    tPrev!: number;
    totalTime = 0;

    init() {
        ShaderChunk.fog_fragment = `
        #ifdef USE_FOG
          vec3 fogOrigin = cameraPosition;
          vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
          float fogDepth = distance(vWorldPosition, fogOrigin);
    
          // f(p) = fbm( p + fbm( p ) )
          vec3 noiseSampleCoord = vWorldPosition * 0.00025 + vec3(
              0.0, 0.0, fogTime * 0.025);
          float noiseSample = FBM(noiseSampleCoord + FBM(noiseSampleCoord)) * 0.5 + 0.5;
          fogDepth *= mix(noiseSample, 1.0, saturate((fogDepth - 5000.0) / 5000.0));
          fogDepth *= fogDepth;
    
          float heightFactor = 0.05;
          float fogFactor = heightFactor * exp(-fogOrigin.y * fogDensity) * (
              1.0 - exp(-fogDepth * fogDirection.y * fogDensity)) / fogDirection.y;
          fogFactor = saturate(fogFactor);
    
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
        #endif`;

        ShaderChunk.fog_pars_fragment = this._NOISE_GLSL + `
        #ifdef USE_FOG
          uniform float fogTime;
          uniform vec3 fogColor;
          varying vec3 vWorldPosition;
          #ifdef FOG_EXP2
            uniform float fogDensity;
          #else
            uniform float fogNear;
            uniform float fogFar;
          #endif
        #endif`;

        ShaderChunk.fog_vertex = `
        #ifdef USE_FOG
          vWorldPosition = worldPosition.xyz;
        #endif`;

        ShaderChunk.fog_pars_vertex = `
        #ifdef USE_FOG
          varying vec3 vWorldPosition;
        #endif`;
    }

    go(data: Data, cameraManMain: CameraManMain) {
        if (!data.camera) {
            throw new Error(`${Utility.timestamp()} Expected camera`);
        }

        const light = new DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(20, 100, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        data.scene.add(light);

        const ambient = new AmbientLight(0x101010);
        data.scene.add(ambient);

        const gui = new GUI();

        const groundMat = new MeshStandardMaterial({ color: new Color(0xffaa00) });
        groundMat.onBeforeCompile = this.modifyShader.bind(this);
        const ground = new Mesh(new BoxGeometry(10, 1, 10), groundMat);
        data.scene.add(ground);

        const box = new Mesh(new BoxGeometry(1, 10, 1), undefined);
        const boxMat = new MeshStandardMaterial({ color: new Color(0x000000) });
        boxMat.onBeforeCompile = this.modifyShader.bind(this);
        box.material = boxMat; // .clone();
        data.scene.add(box);

        data.camera.position.set(0, 7, -12);
        data.camera?.lookAt(0, 2, 0);


        cameraManMain.makeCameraOrbital(box.position);

        data.scene.fog = new FogExp2(0xDFE9F3, 0.05);
        this.rAF();
    }

    modifyShader(s: any) {
        this.shaders.push(s);
        s.uniforms.fogTime = { value: 0.0 };
    }

    rAF() {
        requestAnimationFrame((t) => {
            this.rAF();

            if (this.tPrev === undefined) {
                this.tPrev = t;
            }

            this.step((t - this.tPrev) * 0.001);
            this.tPrev = t;

        });
    }

    step(timeElapsed: number) {
        this.totalTime += timeElapsed;
        for (let s of this.shaders) {
            s.uniforms.fogTime.value = this.totalTime;
        }
    }
}