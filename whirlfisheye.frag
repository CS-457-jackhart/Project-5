#version 330 compatibility

uniform float uPower;
uniform float uRtheta;
uniform float uMosaic;
uniform float uBlend;
uniform sampler2D TexUnitA;
uniform sampler2D TexUnitB;

in vec2 vST;

const vec4 BLACK = vec4(0., 0., 0., 1.);
const float PI = 3.14159265;

float
atan2(float y, float x)
{
     if (x == 0.)
     {
          if (y >= 0.)
               return  PI / 2.;
          else
               return -PI / 2.;
     }
     return atan(y, x);
}

void
main()
{
     // Calculate values for fisheye distortion
     vec2 st = vST - vec2(0.5, 0.5);  // put (0,0) in the middle so that the range is -0.5 to +0.5
     float r = length(st);
     float r_prime = pow(2 * r, uPower);

     // Calculate values for whirl distortion
     float theta = atan2(st.t, st.s);
     float theta_prime = theta - uRtheta * r;

     // Restore (S,T)
     st = r_prime * vec2( cos(theta_prime), sin(theta_prime) );  // now in the range -1. to +1.
     st += 1;                        		                    // change the range to 0. to +2.
     st *= 0.5; 		       			                    // change the range to 0. to +1.

     // Mosaic'ing

     // which block of pixels will this pixel be in?
     int numins = int(st.s / uMosaic);	// same as with the ellipses
     int numint = int(st.t / uMosaic);	// same as with the ellipses
     float sc = numins * uMosaic + (uMosaic / 2.); 		// same as with the ellipses
     float tc = numint * uMosaic + (uMosaic / 2.);		// same as with the ellipses
	// for this block of pixels, we are only going to sample the texture at the center:
	st.s = sc;
     st.t = tc;

     // Blacking out parts that aren't in S or T

     // if s or t end up outside the range [0.,1.], paint the pixel black:
     if (any(lessThan(st, vec2(0., 0.))))
     {
          gl_FragColor = BLACK;
     }
     else
     {
          if (any(greaterThan(st, vec2(1., 1.))))
          {
               gl_FragColor = BLACK;
          }
          else
          {
               vec3 rgb_a = texture(TexUnitA, st).rgb;
               vec3 rgb_b = texture(TexUnitB, st).rgb;

               vec3 rgb = mix(rgb_a, rgb_b, uBlend);

               // sample both textures at (s,t) giving back two rgb vec3's:
               // mix the two rgb's using uBlend
               gl_FragColor = vec4( rgb, 1. );
          }
     }
}