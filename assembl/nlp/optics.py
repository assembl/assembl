'''
 -------------------------------------------------------------------------
 Function:
 [RD,CD,order]=optics(x,min_points)
 -------------------------------------------------------------------------
 Aim:
 Ordering objects of a data set to obtain the clustering structure
 -------------------------------------------------------------------------
 Input:
 x - data set (m,n); m-objects, n-variables
 min_points - number of objects in a neighborhood of the selected object
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

 Core algorithm ported to python Jan, 2009 by Brian H. Clowers,
 Pacific Northwest National Laboratory.
 bhclowers at gmail.com
 Dependencies include numpy, scipy (formerly hcluster, now in scipy)
 Extraction section written by Marc-Antoine Parent
 maparent@acm.org
'''

import numpy as N
from scipy.spatial.distance import pdist, squareform


class Interval(object):
    __slots__ = ('start', 'end')

    def __init__(self, start, end):
        assert start <= end
        self.start = start
        self.end = end

    def __repr__(self):
        return "[%d, %d]" % (self.start, self.end)

    def __hash__(self):
        return hash(self.start) + hash(self.end)

    def __lt__(self, other):
        return self.start > other.start and self.end < other.end

    def __le__(self, other):
        return self.start >= other.start and self.end <= other.end

    def __eq__(self, other):
        return self.start == other.start and self.end == other.end

    def __ne__(self, other):
        return self.start != other.start and self.end != other.end

    def __gt__(self, other):
        return self.start < other.start and self.end > other.end

    def __ge__(self, other):
        return self.start <= other.start and self.end >= other.end

    def __len__(self):
        return self.end - self.start + 1

    def as_slice(self):
        return slice(self.start, self.end + 1)

    def __contains__(self, i):
        return self.start <= i <= self.end

    @classmethod
    def base_cmp(cls, a, b):
        x = cmp(a.start, b.start)
        return x if x != 0 else -cmp(a.end, b.end)


class Dendrogram(object):
    # __slots__ = ("cluster", "subclusters", "parent")

    def __init__(self, cluster, parent=None):
        self.cluster = cluster
        self.subclusters = []
        self.parent = parent

    def pprint(self, level=0):
        print " "*level, self.cluster
        for s in self.subclusters:
            s.pprint(level+1)

    def containing(self, pos):
        if pos not in self.cluster:
            return None
        for cl in self.subclusters:
            cl = cl.containing(pos)
            if cl:
                return cl
        return self

    def find_cluster(self, interval):
        if interval == self.cluster:
            return self
        if interval.start not in self.cluster \
                or interval.end not in self.cluster:
            return None
        for sub in self.subclusters:
            tail = sub.find_cluster(interval)
            if tail is not None:
                return tail
        return None


def euclid(i, x):
    """euclidean(i, x) -> euclidean distance between x and y"""
    y = N.zeros_like(x)
    y += 1
    y *= i
    if len(x) != len(y):
        raise ValueError("vectors must be same length")

    d = (x-y)**2
    return N.sqrt(N.sum(d, axis=1))


class Optics(object):
    def __init__(self, min_points=4, distMethod='cosine'):
        self.min_points = min_points
        self.distMethod = distMethod
        self.RD = None

    def calculate_distances(self, x):
        if len(x.shape) > 1:
            m, n = x.shape
        else:
            m = x.shape[0]
            n == 1

        D = squareform(pdist(x, self.distMethod))

        self.CD = CD = N.zeros(m)
        self.RD = RD = N.ones(m)*1E10

        for i in xrange(m):
            # again you can use the euclid function if you don't want scipy
            # d = euclid(x[i],x)
            # d.sort()
            # CD[i] = d[min_points]

            tempInd = D[i].argsort()
            tempD = D[i][tempInd]
            # tempD.sort() no, this function changes the reference
            CD[i] = tempD[self.min_points]  # **2

        self.order = order = []
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
        # negative distance is a disaster
        RD = N.maximum(RD, 0)
        self.RDO = RD[order]

    def up_point(self, i):
        RD = self.RDO
        if not (0 < i < len(RD)-1):
            return False
        return RD[i] < RD[i+1] * (1-self.eps)

    def down_point(self, i):
        RD = self.RDO
        if not (0 < i < len(RD)-1):
            return False
        return RD[i] * (1-self.eps) > RD[i+1]

    def steep_up_area(self, ivl):
        RD = self.RDO
        if not (self.up_point(ivl.start) and self.up_point(ivl.end)):
            return False
        consecutive = 0
        for i in range(ivl.start, ivl.end):
            if not RD[i+1] >= RD[i]:
                return False
            if self.up_point(i):
                consecutive = 0
            else:
                consecutive += 1
                if consecutive >= self.min_points:
                    return False
        return True

    def max_steep_up_area(self, i):
        RD = self.RDO
        if not self.up_point(i):
            return None
        start, end = i, i
        start_val = RD[start]
        for i in range(start - 1, 0, -1):
            if RD[i] > start_val:
                break
            start_val = RD[i]
            if self.up_point(i) and self.steep_up_area(Interval(i, end)):
                start = i
        end_val = RD[end]
        for i in range(end, len(RD)):
            if RD[i] < end_val:
                break
            end_val = RD[i]
            if self.up_point(i) and self.steep_up_area(Interval(start, i)):
                end = i
        return Interval(start, end)

    def steep_down_area(self, ivl):
        RD = self.RDO
        if not (self.down_point(ivl.start) and self.down_point(ivl.end)):
            return False
        consecutive = 0
        for i in range(ivl.start, ivl.end):
            if not RD[i+1] <= RD[i]:
                return False
            if self.down_point(i):
                consecutive = 0
            else:
                consecutive += 1
                if consecutive >= self.min_points:
                    return False
        return True

    def max_steep_down_area(self, i):
        RD = self.RDO
        if not self.down_point(i):
            return None
        start, end = i, i
        start_val = RD[start]
        for i in range(start - 1, 0, -1):
            if RD[i] < start_val:
                break
            start_val = RD[i]
            if self.down_point(i) and self.steep_down_area(Interval(i, end)):
                start = i
        end_val = RD[end]
        for i in range(end, len(RD)):
            if RD[i] > end_val:
                break
            end_val = RD[i]
            if self.down_point(i) and self.steep_down_area(Interval(start, i)):
                end = i
        return Interval(start, end)

    def is_start_of_steep_down(self, i):
        RD = self.RDO
        if not self.down_point(i):
            return None
        if i > 0 and self.down_point(i-1) and RD[i-1] >= RD[i]:
            return None
        ivl = self.max_steep_down_area(i)
        if ivl is None:
            return None
        if ivl.start != i:
            return None
        return ivl

    def is_start_of_steep_up(self, i):
        RD = self.RDO
        if not self.up_point(i):
            return None
        if i > 0 and self.up_point(i-1) and RD[i-1] <= RD[i]:
            return None
        ivl = self.max_steep_up_area(i)
        if ivl is None:
            return None
        if ivl.start != i:
            return None
        return ivl

    def cluster_boundary(self, down_area, up_area):
        RD = self.RDO
        eps = self.eps
        start = down_area.start
        end1 = up_area.end+1
        endv = RD[end1]
        if RD[down_area.start] * (1-eps) >= endv:
            for i in range(down_area.end, down_area.start-1, -1):
                if RD[i] > endv:
                    break
            return Interval(i, end1-1)
        startv = RD[start]
        if endv*(1-eps) >= startv:
            for i in range(up_area.start, up_area.end+1):
                if RD[i] < startv:
                    break
            return Interval(start, i)
        return Interval(start, end1-1)

    def is_valid_cluster(self, cluster, down_area=None, up_area=None):
        RD = self.RDO
        start, end = cluster.start, cluster.end
        if end - start < self.min_points:
            return False
        cluster_edge = min(RD[start], RD[end+1]) * (1-self.eps)
        max_val = N.amax(RD[start+1:end])
        if max_val > cluster_edge:
            return False
        if down_area:
            if not (down_area.start <= start <= down_area.end):
                return False
        if up_area:
            if not (up_area.start <= end <= up_area.end):
                return False
        return True

    def as_cluster(self, down_area, up_area):
        cluster = self.cluster_boundary(down_area, up_area)
        if self.is_valid_cluster(cluster, down_area, up_area):
            return cluster

    def extract_clusters(self, x=None, eps=0.05):
        self.eps = eps
        if x is not None:
            self.calculate_distances(x)
        else:
            assert self.RD is not None, "You must provide a vector first"
        RD = self.RDO
        steep_down_areas = {}
        clusters = []
        index = 0
        mib = 0
        index = 0
        while index < len(RD):
            mib = max(mib, RD[index])
            ivl = self.is_start_of_steep_down(index)
            if ivl is not None:
                for a in steep_down_areas.keys():
                    if RD[a.start] * (1-eps) < mib:
                        # print "removing ", a
                        del steep_down_areas[a]
                        continue
                    steep_down_areas[a] = max(steep_down_areas[a], RD[index])
                # print "adding ", ivl
                steep_down_areas[ivl] = 0
                index = ivl.end + 1
                mib = RD[index]
                continue
            ivl = self.is_start_of_steep_up(index)
            if ivl is not None:
                for a in steep_down_areas.keys():
                    if RD[a.start] * (1-eps) < mib:
                        # print "removing ", a
                        del steep_down_areas[a]
                        continue
                    steep_down_areas[a] = max(steep_down_areas[a], RD[index])
                cutoff = RD[ivl.end+1] * (1-eps)
                for a in steep_down_areas:
                    if steep_down_areas[a] <= cutoff:
                        # print 'trying', a, ivl
                        cluster = self.as_cluster(a, ivl)
                        if cluster:
                            clusters.append(cluster)
                index = ivl.end + 1
                mib = RD[index]
                continue
            index += 1
        return clusters

    def as_dendrogram(self, clusters):
        clusters = sorted(clusters, Interval.base_cmp)

        base = Dendrogram(Interval(0, len(self.RD)))
        last = base
        for cluster in clusters:
            check = last
            while check:
                if cluster <= check.cluster:
                    check.subclusters.append(Dendrogram(cluster, check))
                    last = check.subclusters[-1]
                    break
                assert cluster.start >= check.cluster.end
                check = check.parent
            else:
                assert False
        return base

    def cluster_as_ids(self, cluster):
        return self.order[cluster.as_slice()]

    def cluster_depth(self, cluster):
        RD = self.RDO
        down_area = self.max_steep_down_area(cluster.start)
        up_area = self.max_steep_up_area(cluster.end)
        return N.amax(RD[down_area.end+1:up_area.start+1]) / max(
            RD[cluster.start], RD[cluster.end+1])

    def as_labels(self, clusters):
        labels = N.zeros(len(self.RD), dtype=N.int)
        for n in range(len(clusters), 0, -1):
            cluster = clusters[n-1]
            for pos in range(cluster.start, cluster.end):
                labels[self.order[pos]] = n
        return labels

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
