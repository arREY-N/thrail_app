export function validateTrail(object, structure){
    let errors = [];

    for(const [key, value] of Object.entries(structure)){
        console.log(`${key}: ${object[key]}`);

        if(structure[key].required && (
            object[key] === null || 
            (object[key].toString() && object[key].toString().trim() === '')) ||
            (object[key].length === 0)
        ){
            console.log(`${value.text}`);
            errors.push(`${value.text}`);
        }
    }

    return errors;
}