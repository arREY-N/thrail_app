export function validateTrailData(trailData){
    if(!trailData.name || trailData.name.trim().length === 0){
        throw new Error('Trail name is required');
    }
    
    if(!trailData.length || trailData.length.trim().length === 0 || trailData.length === '0'){
        throw new Error('Trail length is required');
    }
    
    if(!trailData.province){
        throw new Error('Province is required');
    }
    
    if(!trailData.address || trailData.address.trim().length === 0){
        throw new Error('Address is required');
    }
}