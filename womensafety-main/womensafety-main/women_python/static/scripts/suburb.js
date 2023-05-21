// Function to try and get Average
// const TestFunction = console.log(suburbPosts)
suburbRating = JSON.parse(suburbRating);
allSubPosts = JSON.parse(allSubPosts);
filterPost = JSON.parse(filterPost);
console.log(filterPost)

var row1c1 = document.getElementById("row1c1").innerHTML = allSubPosts[19][2];
var row1c2 = document.getElementById(".row1c2");
var row1c3 = document.getElementById(".row1c3");


// row1c1.href="{{ url_for('post', post_id=allSubPosts[19][0]) }}";

// var row2c1 = document.querySelector(".test");
// var row2c2 = document.querySelector(".test");
// var row2c3 = document.querySelector(".test");

for(let i = 0; i<allSubPosts.length;i++)
{
    // row1c1 = suburbRating[i][1];
    row1c2 = allSubPosts[i][2];
    console.log("Test")
}
// suburbRating.pop();
function sub(){
    console.log(suburbRating);
    // console.log(text);
}
var finalTest = document.querySelector(".test");
//Get Suburb
function getSuburbRating()
{
    //Get Suburb Rating
    var e = document.getElementById('suburbRate');
    var text = e.options[e.selectedIndex].value;
    console.log(text);
    // console.log(su)
    // console.log(suburbRating);
    console.log(allSubPosts);
    for(let i = 0; i < suburbRating.length;i++){
        // console.log(suburbRating[i])
        if(suburbRating[i][0] == text){
            console.log(suburbRating[i]);
            console.log(suburbRating[i][1]);
            finalTest.innerHTML = suburbRating[i]
        }
    }
    
}


// console.log(text)


var search = document.getElementById('suburbButton');
search.addEventListener("click",getSuburbRating);
// search.addEventListener("click",sub);

