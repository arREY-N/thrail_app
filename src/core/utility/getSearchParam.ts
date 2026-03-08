export default function getSearchParam(rawId: any){
    return Array.isArray(rawId) ? rawId[0] : rawId;
}