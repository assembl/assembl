'''
 -------------------------------------------------------------------------
 Function:
 [RD,CD,order]=optics(x,k)
 -------------------------------------------------------------------------
 Aim:
 Ordering objects of a data set to obtain the clustering structure
 -------------------------------------------------------------------------
 Input:
 x - data set (m,n); m-objects, n-variables
 k - number of objects in a neighborhood of the selected object
 (minimal number of objects considered as a cluster)
 -------------------------------------------------------------------------
 Output:
 RD - vector with reachability distances (m,1)
 CD - vector with core distances (m,1)
 order - vector specifying the order of objects (1,m)
 -------------------------------------------------------------------------
 Example of use:
 x=[randn(30,2)*.4;randn(40,2)*.5+ones(40,1)*[4 4]];
 [RD,CD,order]=optics(x,4)
 -------------------------------------------------------------------------
 References:
 [1] M. Ankrest, M. Breunig, H. Kriegel, J. Sander,
 OPTICS: Ordering Points To Identify the Clustering Structure,
 available from www.dbs.informatik.uni-muenchen.de/cgi-bin/papers?query=--CO
 [2] M. Daszykowski, B. Walczak, D.L. Massart, Looking for natural
 patterns in analytical data. Part 2. Tracing local density
 with OPTICS, J. Chem. Inf. Comput. Sci. 42 (2002) 500-507
 -------------------------------------------------------------------------
 Written by Michal Daszykowski
 Department of Chemometrics, Institute of Chemistry,
 The University of Silesia
 December 2004
 http://www.chemometria.us.edu.pl

 ported to python Jan, 2009 by Brian H. Clowers, Pacific Northwest National Laboratory.
 Dependencies include scipy, numpy.
 bhclowers at gmail.com
 Extraction section written by Marc-Antoine Parent
 maparent@acm.org
'''

import numpy as N
from scipy.spatial.distance import pdist, squareform


def optics(x, k, distMethod='euclidean'):
    if len(x.shape) > 1:
        m, n = x.shape
    else:
        m = x.shape[0]
        n == 1

    D = squareform(pdist(x, distMethod))

    CD = N.zeros(m)
    RD = N.ones(m)*1E10

    for i in xrange(m):
        # again you can use the euclid function if you don't want scipy
        # d = euclid(x[i],x)
        # d.sort()
        # CD[i] = d[k]

        tempInd = D[i].argsort()
        tempD = D[i][tempInd]
        # tempD.sort() #we don't use this function as it changes the reference
        CD[i] = tempD[k]  # **2

    order = []
    seeds = N.arange(m, dtype=N.int)

    ind = 0
    while len(seeds) != 1:
        # for seed in seeds:
        ob = seeds[ind]
        seedInd = N.where(seeds != ob)
        seeds = seeds[seedInd]

        order.append(ob)
        tempX = N.ones(len(seeds))*CD[ob]
        tempD = D[ob][seeds]  # [seeds]
        # you can use this function if you don't want to use scipy
        # tempD = euclid(x[ob],x[seeds])

        temp = N.column_stack((tempX, tempD))
        mm = N.max(temp, axis=1)
        ii = N.where(RD[seeds] > mm)[0]
        RD[seeds[ii]] = mm[ii]
        ind = N.argmin(RD[seeds])

    order.append(seeds[0])
    RD[0] = 0  # we set this point to 0 as it does not get overwritten
    return RD, CD, order


eps=0.05


def up_point(RD, i, eps=eps):
    if not (0 < i < len(RD)-1):
        return False
    return RD[i] <= RD[i+1] * (1-eps)


def down_point(RD, i, eps=eps):
    if not (0 < i < len(RD)-1):
        return False
    return RD[i] * (1-eps) >= RD[i+1]


def steep_up_area(RD, start, end, min_points, eps=eps):
    if not (up_point(RD, start, eps) and up_point(RD, end, eps)):
        return False
    consecutive = 0
    for i in range(start, end):
        if not RD[i+1] >= RD[i]:
            return False
        if up_point(RD, i, eps):
            consecutive = 0
        else:
            consecutive += 1
            if consecutive >= min_points:
                return False
    return True


def max_steep_up_area(RD, start, end, min_points, eps=eps):
    if not steep_up_area(RD, start, end, min_points, eps):
        return None
    start_val = RD[start]
    for i in range(start - 1, 0, -1):
        if RD[i] > start_val:
            break
        start_val = RD[i]
        if up_point(RD, i, eps) and steep_up_area(RD, i, end, min_points, eps):
            start = i
    end_val = RD[end]
    for i in range(end, len(RD)):
        if RD[i] < end_val:
            break
        end_val = RD[i]
        if up_point(RD, i, eps) and steep_up_area(RD, start, i, min_points, eps):
            end = i
    return (start, end)


def steep_down_area(RD, start, end, min_points, eps=eps):
    if not (down_point(RD, start, eps) and down_point(RD, end, eps)):
        return False
    consecutive = 0
    for i in range(start, end):
        if not RD[i+1] <= RD[i]:
            return False
        if down_point(RD, i, eps):
            consecutive = 0
        else:
            consecutive += 1
            if consecutive >= min_points:
                return False
    return True


def max_steep_down_area(RD, start, end, min_points, eps=eps):
    if not steep_down_area(RD, start, end, min_points, eps):
        return None
    start_val = RD[start]
    for i in range(start - 1, 0, -1):
        if RD[i] < start_val:
            break
        start_val = RD[i]
        if down_point(RD, i, eps) and steep_down_area(RD, i, end, min_points, eps):
            start = i
    end_val = RD[end]
    for i in range(end, len(RD)):
        if RD[i] > end_val:
            break
        end_val = RD[i]
        if down_point(RD, i, eps) and steep_down_area(RD, start, i, min_points, eps):
            end = i
    return (start, end)


def is_start_of_steep_down(RD, i, min_points, eps=eps):
    if not down_point(RD, i, eps):
        return False
    if i > 0 and down_point(RD, i-1, eps) and RD[i-1] >= RD[i]:
        return False
    r = max_steep_down_area(RD, i, i, min_points, eps)
    if not r:
        return False
    if r[0] != i:
        return False
    return r[1]


def is_start_of_steep_up(RD, i, min_points, eps=eps):
    if not up_point(RD, i, eps):
        return False
    if i > 0 and up_point(RD, i-1, eps) and RD[i-1] <= RD[i]:
        return False
    r = max_steep_up_area(RD, i, i, min_points, eps)
    if not r:
        return False
    if r[0] != i:
        return False
    return r[1]


def cluster_boundary(RD, down_area, up_area, eps=eps):
    start = down_area[0]
    end1 = up_area[1]+1
    endv = RD[end1]
    if RD[down_area[0]] * (1-eps) >= endv:
        for i in range(down_area[1], down_area[0]-1, -1):
            if RD[i] > endv:
                break
        return (i, end1-1)
    startv = RD[start]
    if endv*(1-eps) >= startv:
        for i in range(up_area[0], up_area[1]+1):
            if RD[i] < startv:
                break
        return (start, i)
    return (start, end1-1)


def is_valid_cluster(RD, cluster, min_points, down_area=None, up_area=None, eps=eps):
    start, end = cluster
    if end - start < min_points:
        return False
    cluster_edge = min(RD[start], RD[end+1]) * (1-eps)
    max_val = N.amax(RD[start+1:end])
    if max_val > cluster_edge:
        return False
    if down_area:
        if not (down_area[0] <= start <= down_area[1]):
            return False
    if up_area:
        if not (up_area[0] <= end <= up_area[1]):
            return False
    return True


def as_cluster(RD, down_area, up_area, min_points, eps=eps):
    cluster = cluster_boundary(RD, down_area, up_area, eps)
    if is_valid_cluster(RD, cluster, min_points, down_area, up_area, eps):
        return cluster


class SDArea(object):
    __slots__ = ('start', 'end', 'mib')

    def __init__(self, start, end):
        self.start = start
        self.end = end
        self.mib = 0

    def update_mib(self, val):
        self.mib = max(self.mib, val)


def extract_clusters(RD, min_points, eps=eps):
    steep_down_areas = set()
    clusters = set()
    index = 0
    mib = 0
    index = 0
    while index < len(RD):
        mib = max(mib, RD[index])
        end = is_start_of_steep_down(RD, index, min_points, eps)
        if end is not False:
            for a in steep_down_areas.copy():
                if RD[a.start] * (1-eps) < mib:
                    # print "removing A", a.start, a.end
                    steep_down_areas.remove(a)
                    continue
                a.update_mib(RD[index])
            a = SDArea(index, end)
            # print "adding ", index, end
            steep_down_areas.add(a)
            index = end + 1
            mib = RD[index]
            continue
        end = is_start_of_steep_up(RD, index, min_points, eps)
        if end is not False:
            for a in steep_down_areas.copy():
                if RD[a.start] * (1-eps) < mib:
                    # print "removing A", a.start, a.end
                    steep_down_areas.remove(a)
                    continue
                a.update_mib(RD[index])
            for a in steep_down_areas:
                if RD[end+1] * (1-eps) >= a.mib:
                    # print "trying", (a.start, a.end), (index, end)
                    cluster = as_cluster(RD, (a.start, a.end), (index, end), min_points, eps)
                    if cluster:
                        clusters.add(cluster)
            index = end + 1
            mib = RD[index]
            continue
        index += 1
    return clusters


def euclid(i, x):
    """euclidean(i, x) -> euclidean distance between x and y"""
    y = N.zeros_like(x)
    y += 1
    y *= i
    if len(x) != len(y):
        raise ValueError("vectors must be same length")

    d = (x-y)**2
    return N.sqrt(N.sum(d, axis=1))


if __name__ == "__main__":
    import pylab as P

    testX = N.array(
        [[15., 70.],
         [31., 87.],
         [45., 32.],
         [5., 8.],
         [73., 9.],
         [32., 83.],
         [26., 50.],
         [7., 31.],
         [43., 97.],
         [97., 9.]])

    # mlabOrder = N.array(1,2,6,7,3,8,9,4,5,10)
    # the order returned by the original MATLAB code
    # Remeber MATLAB counts from 1, python from 0

    P.plot(testX[:, 0], testX[:, 1], 'ro')
    RD, CD, order = optics(testX, 4)
    testXOrdered = testX[order]
    P.plot(testXOrdered[:, 0], testXOrdered[:, 1], 'b-')

    print order

    P.show()
