import Vec4 from "../../math/vec4.js";
//import { smoothstep } from "../../fn.js";

class Particle {
    
    constructor(array, ix) {
        this.position = new Vec4(array, ix);
        this.velocity = new Vec4(array, ix + 4);
        this.misc = new Vec4(array, ix + 8);
        this.color = new Vec4(array, ix + 12);
    }
}

// class Particle_ {
//     #ptMgr = null;
//     #array = null;
//     #ix = -1;

//     position = null;
//     velocity = null;
//     acceleration = null;
//     // get mass() { return this.#array[this.#ix+3]; };
//     // set mass(value) { this.#array[this.#ix+3] = value; };
//     // get lifespan() { return this.#array[this.#ix+7]; };
//     // set lifespan(value) { this.#array[this.#ix+7] = value; };
//     get elapsed() { return this.#array[this.#ix+11]; };
//     set elapsed(value) { this.#array[this.#ix+11] = value; };
//     forces;
//     constraints;
    
//     constructor(ptMgr, ix) {
//         this.#ptMgr = ptMgr;
//         this.#array = ptMgr.dataArray;
//         this.#ix = ix;
//         this.position = new Vec3(0, 0, 0, this.#array, this.#ix);
//         this.velocity = new Vec3(0, 0, 0, this.#array, this.#ix+4);
//         this.acceleration = new Vec3(0, 0, 0, this.#array, this.#ix+8);
//     }

//     euler(dt) {
//         // dv = acc*dt
//         let dvX = this.acceleration.x * dt;
//         let dvY = this.acceleration.y * dt;

//         // v += acc*dt
//         this.velocity.x += dvX;
//         this.velocity.y += dvY;

//         // pos += v*dt + 0.5*acc*dt*dt
//         this.position.x += (this.velocity.x + dvX) * dt;
//         this.position.y += (this.velocity.y + dvY) * dt;

//     }

//     // verlet(dt) {
//     //     // Verlet integration for position update
//     //     const dt2 = dt ** 2;
//     //     const x = 2 * this.position.x - this.#prevPosition.x + this.acceleration.x * dt2;
//     //     const y = 2 * this.position.y - this.#prevPosition.y + this.acceleration.y * dt2;
//     //     // update previous position for the next calculation
//     //     this.#prevPosition.x = this.position.x;
//     //     this.#prevPosition.y = this.position.y;
//     //     this.position.x = x;
//     //     this.position.y = y;
//     // }

//     checkCapsuleIntersection(p1, p2, r1, q1, q2, r2) {
//         function getClosestPointOnSegment(px, py, ax, ay, bx, by) {
//             let abx = bx - ax, aby = by - ay;
//             let apx = px - ax, apy = py - ay;
//             let t = (apx * abx + apy * aby) / (abx * abx + aby * aby);
//             t = Math.max(0, Math.min(1, t));
//             return { x: ax + t * abx, y: ay + t * aby };
//         }
        
//         function distanceSquared(p1, p2) {
//             let dx = p2.x - p1.x, dy = p2.y - p1.y;
//             return dx * dx + dy * dy;
//         }

//         let radiusSum = r1 + r2;
//         let radiusSq = radiusSum * radiusSum;
    
//         // Check closest distance between motion paths
//         let closest1 = getClosestPointOnSegment(q1.x, q1.y, p1.x, p1.y, p2.x, p2.y);
//         let closest2 = getClosestPointOnSegment(p1.x, p1.y, q1.x, q1.y, q2.x, q2.y);
    
//         if (distanceSquared(closest1, q1) <= radiusSq || distanceSquared(closest2, p1) <= radiusSq) {
//             return true;
//         }
    
//         // Check direct start and end positions for overlap
//         if (distanceSquared(p1, q1) <= radiusSq || distanceSquared(p2, q2) <= radiusSq) {
//             return true;
//         }
    
//         return false;
//     }

//     checkIntersection(particle2, frame, dt) {
//         function cross(v1, v2) {
//             return v1.x * v2.y - v1.y * v2.x;
//         }

//         if (this.position.dist(particle2.position) < 10) {
//             debugger
//         }

//         let p1 = this.position;
//         let p2 = {
//             x:this.position.x + this.velocity.x*dt,
//             y:this.position.y + this.velocity.y*dt
//         };
//         let q1 = particle2.position;
//         let q2 = {
//             x:particle2.position.x + particle2.velocity.x*dt,
//             y:particle2.position.y + particle2.velocity.y*dt
//         };

//         let r = { x: p2.x - p1.x, y: p2.y - p1.y }; // Vector p1 → p2
//         let s = { x: q2.x - q1.x, y: q2.y - q1.y }; // Vector q1 → q2
//         let qp = { x: q1.x - p1.x, y: q1.y - p1.y }; // Vector p1 → q1
    
//         let rxs = cross(r, s);
//         if (rxs === 0) return null; // Parallel or collinear
    
//         let cross_qp_s = cross(qp, s);
//         let cross_qp_r = cross(qp, r);
    
//         // Instead of dividing early, compare with `rxs`
//         if (cross_qp_s < 0 || cross_qp_s > rxs || cross_qp_r < 0 || cross_qp_r > rxs) {
//             return null; // Intersection outside segment bounds
//         }
    
//         let t = cross_qp_s / rxs; // Only divide now
//         return { 
//             x: p1.x + t * r.x, 
//             y: p1.y + t * r.y 
//         };
//     }

//     checkCollision(particle2, frame, dt) {
//         return this.checkCapsuleIntersection(
//             { x: this.position.x, y: this.position.y },
//             { x: this.position.x + this.velocity.x * dt, y: this.position.y + this.velocity.y * dt },
//             this.size/2,
//             { x: particle2.position.x, y: particle2.position.y },
//             { x: particle2.position.x + particle2.velocity.x * dt, y: particle2.position.y + particle2.velocity.y * dt },
//             particle2.size/2
//         );
//     }

//     update(frame, dt) {
//         if (this.isActive) {
//             // apply all forces
//             for (const force of this.forces) {
//                 force(this, frame, dt);
//             }

//             //this.verlet(dt);
//             this.euler(dt);

//             // check all constraints
//             for (const constraint of this.constraints) {
//                 constraint(this, frame, dt);
//             }

//             // reset acceleration for the next iteration
//             this.acceleration.x = 0;
//             this.acceleration.y = 0;
//         }
//     }

// }
export default Particle;