# Physical modelling of motion and collision of 2d objects

The physical model tries to solve the linear and angular motion equations and resolve collisions for any line segments (not necessarily forming polygons) happening within a given period of time.
The basic element is the _rigid-item_ that holds the line segments and the kinetic parameters.
These items can be assembled together to form 2d _rigit-bodies_ by adding additional constraints between the parts.

## Structures
- __V2__(__float__ x, __float__ y): 2d vector.
- __Point2d__(__V2__ position, __float__ mass): 2d point of mass.
- __Segment__(__Point2d__ a, __Point2d__ b): 2d line segment with 2 end-points.
- __Item2d__(__V2__[] aabb, __Segment__[] segments): 2d item of line segments with an _axis-aligned bounding box_.
- __RigidItem2d__(__V2 velocity__, __V2__ position, __float__ omega, __float__ angle, __float__ mass) extends __Item2d__: 2d rigid item with kinetic properties

## Main cycle
1. update states of rigid items
2. resolve collisions and eventually go back to step 1.
3. render rigid items

### Update rigid items
_Linear properties_

        a: linear acceleration
        v: linear velocity
        p: position
        m: total mass
        F:force
        dt: elapsed (delta) time

- calculate linear acceleration from applied forces
        a = Sum(F)/m
- calculate linear velocity
        v' = v + dv = v + a * dt
- calculate new position
        p' = p + dt * (v + 0.5 * dv) = v * dt + 0.5 * a * dt²

_Angular properties_

        b: angular acceleration
        w: angular velocity
        d: angle
        I: total moment of inertia (pre-calculated for geometry)
        C: rotation axis/center of mass
        q: torque
        r: distance between incident point and rotation axis (center of mass)
        F: force (perpendicular to r)
        dt: elapsed time
- calculate torque
        q = r * F
- calculate angular acceleration
        b = q / I = r * F / I
- calculate angular velocity
        w' = w + b * dt
- calculate new angle
        d' = d + w' * dt = d + w * dt + 0.5 * b * dt²
- calculate new position by rotating around C
        p' = p + rot(C, d')

### Calculate the moment of inertia
A good approximation of the moment of inertia for a given geometry greatly improves the simulation of rotating objects. There can be 2 steps of approximation
- point-based: a mass is assigned to every point of the geometry, the total moment of inertia is the sum over all points multiplied by a factor (1/3)

        mi: mass of point i
        pi: position vector of point i
        c = SUM(i=0..n, mi * pi)/SUM(j=0..n, mj)
        I = SUM(i=0..n, mi*(c - pi)²)/3
- triangle-based: the geometry is decomposed into triangles that have their own moment of inertia calcualted using formulas, and are summed up to get the total moment of inertia.

        Ai: area if triangle i
        di: density of triangle i
        pi: position vector of center of triangle i
        qij: point j of triangle i
        mi: mass of triangle i
        mi = Ai * di
        c = SUM(i=0..n, mi * pi)/SUM(j=0..n, mj)
        I = SUM(i=0..n, mi*INTEGRAL(Ai, (qij-c)²dA))

### Render rigid items
Rendering can visualize the _points_, the line segments as _lines_ or the _triangles_ retrieved by decomposing the original shape.

## Solutions

### CPU-based

### GPU-base

### Mixed
