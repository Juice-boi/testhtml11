window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        alert('WebGL not supported');
    }

    // Vertex shader
    const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        
        void main() {
            v_uv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader
    const fragmentShaderSource = `
        precision highp float;
        
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_speed;
        uniform float u_pixelation;
        uniform float u_zoom;
        uniform float u_gradient_pixelation;
        uniform float u_background_threshold;
        uniform float u_color_low_threshold;
        uniform float u_color_mid_threshold;
        uniform vec4 u_color_low;
        uniform vec4 u_color_mid;
        uniform vec4 u_color_high;
        
        varying vec2 v_uv;
        
        const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);
        
        float roundCustom(float x) {
            return floor(x + 0.5);
        }
        
        float rand(vec2 n) { 
            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }
        
        float noise(vec2 p) {
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u * u * (3.0 - 2.0 * u);
            
            float res = mix(
                mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
                mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
                
            return res * res;
        }
        
        float fbm(vec2 p, float iTime) {
            float f = 0.0;
            
            f += 0.500000 * noise(p + iTime); p = mtx * p * 2.02;
            f += 0.031250 * noise(p); p = mtx * p * 2.01;
            f += 0.250000 * noise(p); p = mtx * p * 2.03;
            f += 0.125000 * noise(p); p = mtx * p * 2.01;
            f += 0.062500 * noise(p); p = mtx * p * 2.04;
            f += 0.015625 * noise(p + sin(iTime));
            
            return f / 0.96875;
        }
        
        float pattern(in vec2 p, float iTime) {
            return fbm(p + fbm(p + fbm(p, iTime), iTime), iTime);
        }
        
        vec4 colormap(float x, vec2 uv) {
            x *= (1.0 - pow(max(abs(0.5 - uv.x), abs(0.5 - uv.y)) * 2.0, 3.0));
            
            if (x < u_background_threshold) { 
                return vec4(0.0, 0.0, 0.0, 0.0);
            }
            else if (x < u_color_low_threshold) { 
                return mix(
                    vec4(0.0, 0.0, 0.0, 0.0),
                    u_color_low,
                    roundCustom((x - u_background_threshold) / (u_color_low_threshold - u_background_threshold) / u_gradient_pixelation) * u_gradient_pixelation
                );
            }
            else if (x < u_color_mid_threshold) { 
                return mix(
                    u_color_low,
                    u_color_mid,
                    roundCustom((x - u_color_low_threshold) / (u_color_mid_threshold - u_color_low_threshold) / u_gradient_pixelation) * u_gradient_pixelation
                );
            }
            else {
                return mix(
                    u_color_mid,
                    u_color_high,
                    roundCustom((x - u_color_mid_threshold) / (1.0 - u_color_mid_threshold) / u_gradient_pixelation) * u_gradient_pixelation
                );
            }
        }
        
        void main() {
            float iTime = u_time * u_speed;
            vec2 pixelSize = 1.0 / u_resolution;
            vec2 uv = floor(v_uv / pixelSize / u_pixelation) * pixelSize * u_pixelation;
            float shade = pattern(uv * u_zoom, iTime);
            
            gl_FragColor = colormap(shade, uv);
        }
    `;

    // Compile shader
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create program
    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Set up fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    
    // Get uniform locations
    const uniforms = {
        u_time: gl.getUniformLocation(program, 'u_time'),
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_speed: gl.getUniformLocation(program, 'u_speed'),
        u_pixelation: gl.getUniformLocation(program, 'u_pixelation'),
        u_zoom: gl.getUniformLocation(program, 'u_zoom'),
        u_gradient_pixelation: gl.getUniformLocation(program, 'u_gradient_pixelation'),
        u_background_threshold: gl.getUniformLocation(program, 'u_background_threshold'),
        u_color_low_threshold: gl.getUniformLocation(program, 'u_color_low_threshold'),
        u_color_mid_threshold: gl.getUniformLocation(program, 'u_color_mid_threshold'),
        u_color_low: gl.getUniformLocation(program, 'u_color_low'),
        u_color_mid: gl.getUniformLocation(program, 'u_color_mid'),
        u_color_high: gl.getUniformLocation(program, 'u_color_high')
    };

    function resize() {
        const main = document.querySelector('main');
        const fullHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            main.scrollHeight
        );
        const fullWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
            main.scrollWidth
        );
        
        canvas.width = fullWidth;
        canvas.height = fullHeight;
        canvas.style.width = fullWidth + 'px';
        canvas.style.height = fullHeight + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    
    // Use MutationObserver to watch for content changes
    const main = document.querySelector('main');
    const observer = new MutationObserver(resize);
    observer.observe(main, { childList: true, subtree: true });
    
    // Call resize multiple times to catch lazy loading
    resize();
    setTimeout(resize, 100);
    setTimeout(resize, 500);

    // Render loop
    function render(time) {
        time *= 0.001; // Convert to seconds
        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Set uniforms
        gl.uniform1f(uniforms.u_time, time);
        gl.uniform2f(uniforms.u_resolution, canvas.width*2, canvas.height);
        gl.uniform1f(uniforms.u_speed, 0.1);
        gl.uniform1f(uniforms.u_pixelation, 4);
        gl.uniform1f(uniforms.u_zoom, 4);
        gl.uniform1f(uniforms.u_gradient_pixelation, 0.2);
        gl.uniform1f(uniforms.u_background_threshold, 0.0);
        gl.uniform1f(uniforms.u_color_low_threshold, 0.24);
        gl.uniform1f(uniforms.u_color_mid_threshold, 0.48);
        gl.uniform4f(uniforms.u_color_low, 0.51, 0.76, 0.29, 1.00);
        gl.uniform4f(uniforms.u_color_mid, 0.35, 0.67, 0.27, 1.00);
        gl.uniform4f(uniforms.u_color_high, 0.18, 0.58, 0.24, 1.00);
        
        // Draw
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
    });