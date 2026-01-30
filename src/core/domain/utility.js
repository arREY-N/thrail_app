export function validate(structure, object){
    let errors = [];

    for (const [key, value] of Object.entries(structure)) {
        
        console.log(`${key}: ${object[key]}`);

        if(!object[key] || object[key].toString().trim() === ''){
            errors.push(`${value}`);
        }
    }
    
    return errors;
}

export function validateTrail(object, structure){
    let errors = [];

    console.log(structure);
    console.log(object);

    for(const [key, value] of Object.entries(structure)){
        console.log(`${key}: ${object.key}`);

        if(object[key] === null || object[key].toString().trim() === ''){
            console.log(`${value.text}`);
            errors.push(`${value.text}`);
        }
    }

    return errors;
}