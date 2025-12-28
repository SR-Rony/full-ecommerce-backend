export const buildSearchProductQuery = (q)=> {
    /// hardcoded dynamic search.
    if(q.trim().toLowerCase()=="tren" || q.trim().toLowerCase()=="trenbolone") {
        return {
            $or: ["Trenbolone Enanthate","Trenbolone Acetate","Parabolan"].map((e)=>({ title: { $regex: new RegExp(e,"i") }}))
        }
    }

    if(["test cyp", "cyp", "testosterone","cypionate","cypionate"].includes(q.trim().toLowerCase())) {
        return {
            $or: ["TESTOSTERONE CYPIONATE", "PFIZER DEPO-TEST"].map((e)=>({ title: { $regex: new RegExp(e,"i") }}))
        }
    }

    if(["test enan", "testosterone enanthate", "test e"].includes(q.trim().toLowerCase())) {
        return {
            $or: ["TESTOSTERONE ENANTHATE"].map((e)=>({ title: { $regex: new RegExp(e,"i") }}))
        }
    }
    if(["deca"].includes(q.trim().toLowerCase())) {
        return {
            $or: ["DECA"].map((e)=>({ title: { $regex: new RegExp(e,"i") }}))
        }
    }

    /// dynamic.
    function textToRegexPattern(text) {
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&amp;');
        const pattern = escapedText.split('').map(char => `[^a-zA-Z0-9]*${char}`).join('') + '[^a-zA-Z0-9]*';
        return new RegExp(pattern, 'i');
    }
    return {
        $or: [
          { title: { $regex: new RegExp(q.trim(), 'i') } },
          { title: { $regex: textToRegexPattern(q.trim()) } },
          { title: { $regex: textToRegexPattern(q.trim().replace(/[^a-zA-Z0-9\s]/g, '')) } },
          { title: { $regex: new RegExp(q.trim().replace(/[^a-zA-Z0-9\s]/g, ''), 'i') } },
          { "seo.keywords": { $regex: new RegExp(q.trim(), 'i') } },
          { title: q.trim() },
        ]
    };
}