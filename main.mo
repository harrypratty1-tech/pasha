import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  type PhotoType = {
    #portrait;
    #couple;
  };

  type Photo = {
    photoType : PhotoType;
    blob : Storage.ExternalBlob;
  };

  var openedCount = 0;
  var hasPhotos : Bool = false;
  var portraitPhoto : ?Photo = null;
  var couplePhoto : ?Photo = null;

  public shared ({ caller }) func uploadPhoto(photoType : PhotoType, blob : Storage.ExternalBlob) : async () {
    let photo = {
      photoType;
      blob;
    };
    switch (photoType) {
      case (#portrait) {
        portraitPhoto := ?photo;
      };
      case (#couple) {
        couplePhoto := ?photo;
      };
    };
    hasPhotos := true;
  };

  public query ({ caller }) func getPhoto(photoType : PhotoType) : async ?Photo {
    switch (photoType) {
      case (#portrait) { portraitPhoto };
      case (#couple) { couplePhoto };
    };
  };

  public shared ({ caller }) func cardOpened() : async () {
    if (not hasPhotos) { Runtime.trap("Photo is missing!") };
    openedCount += 1;
  };

  public query ({ caller }) func getOpenedCount() : async Nat {
    openedCount;
  };
};
