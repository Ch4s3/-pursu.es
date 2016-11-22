port module AlgoliaSearch exposing (..)

import Html exposing (..)
import Html as App
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import String


main =
    App.program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- MODEL


type alias Model =
    { query : String
    , results : AlgoliaResult
    }


type alias AlgoliaResult =
    { query : String
    , hits : List Hit
    }


type alias Hit =
    { text : String
    , title : String
    , tags : List String
    }


emptyAlgoliaResult =
    (AlgoliaResult "" [])


init : ( Model, Cmd Msg )
init =
    ( Model "" emptyAlgoliaResult, Cmd.none )



-- UPDATE


type Msg
    = Query String
    | Search
    | Show AlgoliaResult


port search : String -> Cmd msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Query newQuery ->
            ( Model newQuery model.results, search newQuery )

        Search ->
            ( model, search model.query )

        Show newResults ->
            ( Model model.query newResults, Cmd.none )


toHtmlList : AlgoliaResult -> Html msg
toHtmlList result =
    ul [] (List.map toLi result.hits)


toLi : Hit -> Html msg
toLi hit =
    li [] [ text hit.title ]



-- SUBSCRIPTIONS


port results : (AlgoliaResult -> msg) -> Sub msg


subscriptions : Model -> Sub Msg
subscriptions model =
    results Show



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ input [ type_ "text", placeholder "search for a post", onInput Query ] []
        , div [] [ toHtmlList model.results ]
          -- not sure how to get a list here
        ]
