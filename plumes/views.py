from django.shortcuts import render
from django.core.serializers import serialize
from django.http import HttpResponse, Http404, JsonResponse
import datetime

from .models import Region, Plume

# The main view this is the prototyping area
def index(request) : 
    context = {}
    return render(request,'plumes/map.html',context)

def query(request) : 
    # data = list(Plume.objects.all().values()) 
    qstr = request.GET.get('q').split(',')

    q = Plume.objects.all()

    index = 0 
    blist = []
    rlist = []
    while (qstr[index] != 'eb') : 
        blist.append(int(qstr[index]))
        index += 1

    index += 1

    while (qstr[index] != 'er') : 
        rlist.append(int(qstr[index]))
        index += 1

    maxht = int(qstr[index + 1])
    minht = int(qstr[index + 2])
    maxfrp = int(qstr[index + 3])
    minfrp = int(qstr[index + 4])

    st = qstr[index+5].split('-')
    et = qstr[index+6].split('-')

    # print

    if (len(blist) > 0) : 
        q = q.filter(p_biome_id__in=blist)

    if (len(rlist) > 0) : 
        q = q.filter(p_region_id__in=rlist)

    q=q.filter(p_max_ht__lte=maxht)
    q=q.filter(p_max_ht__gte=minht)
    q=q.filter(p_total_frp__lte=maxfrp)
    q=q.filter(p_total_frp__gte=minfrp)

    q=q.filter(p_date__gte=datetime.date(int(st[0]),int(st[1]),int(st[2])))
    q=q.filter(p_date__lte=datetime.date(int(et[0]),int(et[1]),int(et[2])))

    # q = q.filter(p_biome_id=0)


    # d = serialize('geojson',q,geometry_field='point')
    # print(d)
    data = list(q.values())
    return JsonResponse(data,safe=False)
    
