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